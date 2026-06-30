from typing import Dict
from app.verification.base import BaseVerificationPredicate
from app.verification.predicates.chromatic_k4 import ChromaticK4Predicate
from app.verification.predicates.planar_3color import Planar3ColorPredicate
from app.verification.predicates.hamiltonian import Degree2HamiltonianPredicate
from app.verification.predicates.tree_leaves import TreeLeavesPredicate
from app.verification.predicates.path_hamiltonian import PathHamiltonianPredicate

_predicates: Dict[str, BaseVerificationPredicate] = {
    "chromatic_k4": ChromaticK4Predicate(),
    "planar_3color": Planar3ColorPredicate(),
    "degree2_hamiltonian": Degree2HamiltonianPredicate(),
    "tree_leaves": TreeLeavesPredicate(),
    "path_hamiltonian": PathHamiltonianPredicate(),
}

def get_predicate(key: str) -> BaseVerificationPredicate:
    if key not in _predicates:
        raise KeyError(f"Verification predicate '{key}' is not registered.")
    return _predicates[key]
