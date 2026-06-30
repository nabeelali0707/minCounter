import ast
import json
from dataclasses import dataclass
from typing import Any

from app.config import settings


ALLOWED_DIFFICULTIES = {"beginner", "medium", "hard"}
REQUIRED_FIELDS = {
    "title",
    "statement_text",
    "why_false",
    "known_minimal_counterexample",
    "difficulty",
    "draft_predicate",
}

SYSTEM_PROMPT = """
You generate draft graph theory counterexample problems for MinCounter.

Return strict JSON only. Do not include markdown, code fences, comments, prose outside
the JSON object, or trailing commas.

The JSON object must contain exactly these top-level fields:
- title: short unique problem title
- statement_text: a false but plausible graph theory statement
- why_false: concise explanation of why the statement is false
- known_minimal_counterexample: object with:
  - num_vertices: integer, at most 20
  - edges: list of two-integer lists, using vertices 0 through num_vertices - 1
- difficulty: one of beginner, medium, hard
- draft_predicate: Python source code defining exactly this public function:
  def verify(graph_data: dict) -> tuple[bool, str]

The draft predicate requirements:
- It must use networkx.
- It must import and use build_graph from app.verification.graph_utils.
- graph_data is always {"edges": [[0,1],[1,2]], "num_vertices": N}.
- verify must return (True, reason) only when graph_data is a valid counterexample
  to statement_text, and (False, reason) otherwise.
- Keep the implementation deterministic and suitable for graphs with at most 20 vertices.
- Do not read files, open network connections, execute subprocesses, or use eval/exec.

Prefer well-known, checkable graph statements. The counterexample should be plausible
as a minimal example, but this is a draft for human admin review before publication.
"""


class ProblemGenerationError(Exception):
    """Raised when Gemini cannot produce a usable draft problem."""


@dataclass(frozen=True)
class GeneratedProblem:
    title: str
    statement_text: str
    why_false: str
    known_minimal_counterexample: dict[str, Any]
    difficulty: str
    draft_predicate: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "statement_text": self.statement_text,
            "why_false": self.why_false,
            "known_minimal_counterexample": self.known_minimal_counterexample,
            "difficulty": self.difficulty,
            "draft_predicate": self.draft_predicate,
            "object_type": "graph",
            "size_metric": "vertices",
        }


def generate_problem(difficulty: str) -> dict[str, Any]:
    difficulty = difficulty.lower()
    if difficulty not in ALLOWED_DIFFICULTIES:
        raise ProblemGenerationError("Difficulty must be one of beginner, medium, or hard.")
    if not settings.GEMINI_API_KEY:
        raise ProblemGenerationError("GEMINI_API_KEY is not configured.")

    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise ProblemGenerationError(
            "google-generativeai is not installed. Install backend requirements first."
        ) from exc

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        response = model.generate_content(
            (
                "Generate one MinCounter graph theory problem at "
                f"{difficulty} difficulty. The difficulty field must be '{difficulty}'."
            ),
            generation_config={
                "temperature": 0.7,
                "response_mime_type": "application/json",
            },
        )
    except Exception as exc:
        raise ProblemGenerationError(f"Gemini API error: {exc}") from exc

    text = getattr(response, "text", None)
    if not text:
        raise ProblemGenerationError("Gemini returned an empty response.")

    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ProblemGenerationError("Gemini response was not valid JSON.") from exc

    generated = validate_generated_problem(raw, expected_difficulty=difficulty)
    return generated.to_dict()


def validate_generated_problem(
    raw: dict[str, Any], expected_difficulty: str | None = None
) -> GeneratedProblem:
    if not isinstance(raw, dict):
        raise ProblemGenerationError("Generated problem must be a JSON object.")

    missing = sorted(REQUIRED_FIELDS - set(raw))
    if missing:
        raise ProblemGenerationError(f"Generated problem is missing fields: {', '.join(missing)}.")

    title = _required_str(raw, "title")
    statement_text = _required_str(raw, "statement_text")
    why_false = _required_str(raw, "why_false")
    difficulty = _required_str(raw, "difficulty").lower()
    draft_predicate = _required_str(raw, "draft_predicate")

    if difficulty not in ALLOWED_DIFFICULTIES:
        raise ProblemGenerationError("Generated difficulty must be beginner, medium, or hard.")
    if expected_difficulty and difficulty != expected_difficulty:
        raise ProblemGenerationError(
            f"Generated difficulty '{difficulty}' did not match requested '{expected_difficulty}'."
        )

    counterexample = _validate_counterexample(raw["known_minimal_counterexample"])
    _validate_draft_predicate(draft_predicate)

    return GeneratedProblem(
        title=title,
        statement_text=statement_text,
        why_false=why_false,
        known_minimal_counterexample=counterexample,
        difficulty=difficulty,
        draft_predicate=draft_predicate,
    )


def _required_str(raw: dict[str, Any], field: str) -> str:
    value = raw.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ProblemGenerationError(f"Field '{field}' must be a non-empty string.")
    return value.strip()


def _validate_counterexample(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ProblemGenerationError("known_minimal_counterexample must be an object.")

    num_vertices = value.get("num_vertices")
    edges = value.get("edges")
    if not isinstance(num_vertices, int):
        raise ProblemGenerationError("known_minimal_counterexample.num_vertices must be an integer.")
    if num_vertices < 1 or num_vertices > 20:
        raise ProblemGenerationError("known_minimal_counterexample.num_vertices must be between 1 and 20.")
    if not isinstance(edges, list):
        raise ProblemGenerationError("known_minimal_counterexample.edges must be a list.")

    normalized_edges: list[list[int]] = []
    for edge in edges:
        if (
            not isinstance(edge, list)
            or len(edge) != 2
            or not all(isinstance(vertex, int) for vertex in edge)
        ):
            raise ProblemGenerationError("Each edge must be a two-integer list.")
        source, target = edge
        if source == target:
            raise ProblemGenerationError("Self-loops are not allowed in generated counterexamples.")
        if source < 0 or target < 0 or source >= num_vertices or target >= num_vertices:
            raise ProblemGenerationError("Counterexample edge endpoint is outside the vertex range.")
        normalized_edges.append([source, target])

    return {"num_vertices": num_vertices, "edges": normalized_edges}


def _validate_draft_predicate(code: str) -> None:
    if "def verify(" not in code:
        raise ProblemGenerationError("draft_predicate must contain def verify().")
    if "build_graph" not in code:
        raise ProblemGenerationError("draft_predicate must use build_graph().")

    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        raise ProblemGenerationError(f"draft_predicate has invalid Python syntax: {exc}") from exc

    verify_defs = [
        node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "verify"
    ]
    if len(verify_defs) != 1:
        raise ProblemGenerationError("draft_predicate must define exactly one top-level verify function.")

    verify_def = verify_defs[0]
    if len(verify_def.args.args) != 1 or verify_def.args.args[0].arg != "graph_data":
        raise ProblemGenerationError("verify must accept exactly one argument named graph_data.")

    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in {"eval", "exec", "open", "compile", "__import__"}:
                raise ProblemGenerationError(f"draft_predicate may not call {node.func.id}().")
