import importlib
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.database import get_db
from app.models.problem import Problem
from app.models.user import User
from app.verification import registry
from app.verification.ai_generator import (
    ProblemGenerationError,
    generate_problem,
    validate_generated_problem,
)


router = APIRouter()


@router.post("/generate-problem", status_code=status.HTTP_201_CREATED)
def generate_admin_problem(
    difficulty: str = Query(..., pattern="^(beginner|medium|hard)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    try:
        generated = generate_problem(difficulty)
    except ProblemGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    problem = Problem(
        title=generated["title"],
        statement_text=generated["statement_text"],
        object_type="graph",
        size_metric="vertices",
        verification_predicate_ref="pending_ai_generated",
        status="draft",
        difficulty=generated["difficulty"],
        why_false=generated["why_false"],
        known_minimal_counterexample=generated["known_minimal_counterexample"],
        draft_predicate=generated["draft_predicate"],
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)

    problem.verification_predicate_ref = f"ai_generated_{problem.id}"
    db.commit()
    db.refresh(problem)
    return _problem_to_admin_json(problem)


@router.post("/approve-problem/{problem_id}")
def approve_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    problem = _get_draft_problem(db, problem_id)
    _validate_problem_before_approval(problem)

    predicate_ref = f"ai_generated_{problem.id}"
    predicate_path = _predicate_file_path(predicate_ref)
    predicate_path.write_text(_build_predicate_file(problem.draft_predicate), encoding="utf-8")

    _register_predicate_in_registry(predicate_ref)
    _register_predicate_in_memory(predicate_ref)

    problem.verification_predicate_ref = predicate_ref
    problem.status = "active"
    db.commit()
    db.refresh(problem)
    return _problem_to_admin_json(problem)


@router.get("/draft-problems")
def list_draft_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    problems = db.query(Problem).filter(Problem.status == "draft").order_by(Problem.created_at.desc()).all()
    return [_problem_to_admin_json(problem) for problem in problems]


@router.delete("/reject-problem/{problem_id}")
def reject_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    problem = _get_draft_problem(db, problem_id)
    db.delete(problem)
    db.commit()
    return {"detail": "Draft problem rejected and deleted.", "problem_id": problem_id}


def _get_draft_problem(db: Session, problem_id: int) -> Problem:
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    if problem.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft problems can be modified by this route.",
        )
    return problem


def _validate_problem_before_approval(problem: Problem) -> None:
    try:
        validate_generated_problem(
            {
                "title": problem.title,
                "statement_text": problem.statement_text,
                "why_false": problem.why_false,
                "known_minimal_counterexample": problem.known_minimal_counterexample,
                "difficulty": problem.difficulty,
                "draft_predicate": problem.draft_predicate,
            }
        )
    except ProblemGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def _predicate_file_path(predicate_ref: str) -> Path:
    base_dir = Path(__file__).resolve().parents[1] / "verification" / "predicates"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir / f"{predicate_ref}.py"


def _build_predicate_file(draft_predicate: str) -> str:
    return (
        "from typing import Tuple\n"
        "import networkx as nx\n"
        "from app.verification.base import BaseVerificationPredicate\n"
        "from app.verification.graph_utils import build_graph\n\n\n"
        f"{draft_predicate.strip()}\n\n\n"
        "class AIGeneratedPredicate(BaseVerificationPredicate):\n"
        "    def verify(self, G: nx.Graph) -> Tuple[bool, str]:\n"
        "        graph_data = {\n"
        "            \"edges\": [[int(u), int(v)] for u, v in G.edges()],\n"
        "            \"num_vertices\": G.number_of_nodes(),\n"
        "        }\n"
        "        return verify(graph_data)\n"
    )


def _register_predicate_in_registry(predicate_ref: str) -> None:
    registry_path = Path(registry.__file__).resolve()
    source = registry_path.read_text(encoding="utf-8")

    import_line = (
        f"from app.verification.predicates.{predicate_ref} "
        "import AIGeneratedPredicate as "
        f"{_class_alias(predicate_ref)}"
    )
    if import_line not in source:
        lines = source.splitlines()
        insert_at = 0
        for index, line in enumerate(lines):
            if line.startswith("from app.verification.predicates."):
                insert_at = index + 1
        lines.insert(insert_at, import_line)
        source = "\n".join(lines) + "\n"

    entry_line = f'    "{predicate_ref}": {_class_alias(predicate_ref)}(),'
    if f'"{predicate_ref}"' not in source:
        source = re.sub(
            r"(_predicates: Dict\[str, BaseVerificationPredicate\] = \{\n)",
            rf"\1{entry_line}\n",
            source,
            count=1,
        )

    registry_path.write_text(source, encoding="utf-8")


def _register_predicate_in_memory(predicate_ref: str) -> None:
    module = importlib.import_module(f"app.verification.predicates.{predicate_ref}")
    registry._predicates[predicate_ref] = module.AIGeneratedPredicate()


def _class_alias(predicate_ref: str) -> str:
    return "".join(part.capitalize() for part in predicate_ref.split("_")) + "Predicate"


def _problem_to_admin_json(problem: Problem) -> dict:
    return {
        "id": problem.id,
        "title": problem.title,
        "statement_text": problem.statement_text,
        "object_type": problem.object_type,
        "size_metric": problem.size_metric,
        "verification_predicate_ref": problem.verification_predicate_ref,
        "status": problem.status,
        "difficulty": problem.difficulty,
        "why_false": problem.why_false,
        "known_minimal_counterexample": problem.known_minimal_counterexample,
        "draft_predicate": problem.draft_predicate,
        "created_at": problem.created_at,
    }
