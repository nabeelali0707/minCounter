import networkx as nx
from typing import Tuple
from app.verification.base import BaseVerificationPredicate

class TreeLeavesPredicate(BaseVerificationPredicate):
    """
    False statement: "Every tree has exactly two leaves."
    A valid counterexample must be a tree but have a number of leaves (degree 1 nodes) != 2.
    """

    def verify(self, G: nx.Graph) -> Tuple[bool, str]:
        # 1. Check if it's a tree
        if not nx.is_tree(G):
            return False, "Graph is not a tree. A tree must be connected and acyclic."

        # 2. Count leaves (degree == 1)
        leaves = [node for node, degree in G.degree() if degree == 1]
        leaf_count = len(leaves)

        # 3. Check if leaf count is not equal to 2
        if leaf_count == 2:
            return False, "Tree has exactly 2 leaves (it is a path graph). A counterexample must have a different number of leaves."

        return True, f"Valid counterexample! Graph is a tree with {leaf_count} leaves (leaves: {leaves})."
