import importlib
from typing import Dict
from app.verification.base import BaseVerificationPredicate
from app.verification.predicates.chromatic_k4 import ChromaticK4Predicate
from app.verification.predicates.planar_3color import Planar3ColorPredicate
from app.verification.predicates.min_degree_hamiltonian import MinDegreeHamiltonianPredicate
from app.verification.predicates.tree_leaves import TreeLeavesPredicate
from app.verification.predicates.ham_path_to_cycle import HamPathToCyclePredicate

_predicates: Dict[str, BaseVerificationPredicate] = {
    "chromatic_k4": ChromaticK4Predicate(),
    "planar_3color": Planar3ColorPredicate(),
    "min_degree_hamiltonian": MinDegreeHamiltonianPredicate(),
    "tree_leaves": TreeLeavesPredicate(),
    "ham_path_to_cycle": HamPathToCyclePredicate(),
}

def get_predicate(key: str) -> BaseVerificationPredicate:
    if key not in _predicates:
        if key.startswith("ai_generated_"):
            try:
                module = importlib.import_module(f"app.verification.predicates.{key}")
                _predicates[key] = module.AIGeneratedPredicate()
                return _predicates[key]
            except Exception as e:
                raise KeyError(f"Failed to dynamically load AI predicate '{key}': {e}")
        raise KeyError(f"Verification predicate '{key}' is not registered.")
    return _predicates[key]
