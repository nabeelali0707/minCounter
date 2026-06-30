import networkx as nx
from typing import Tuple
from app.verification.base import BaseVerificationPredicate

class MinDegreeHamiltonianPredicate(BaseVerificationPredicate):
    """
    False statement: "Every connected graph with minimum degree >= 2 has a Hamiltonian cycle."
    A valid counterexample must be connected, have min degree >= 2, and have NO Hamiltonian cycle.
    """

    def _has_hamiltonian_cycle(self, G: nx.Graph) -> bool:
        n = G.number_of_nodes()
        if n < 3:
            return False
        nodes = list(G.nodes())
        start_node = nodes[0]
        visited = {start_node}
        path = [start_node]

        def backtrack(curr) -> bool:
            if len(path) == n:
                return G.has_edge(curr, start_node)
            for neighbor in G.neighbors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    path.append(neighbor)
                    if backtrack(neighbor):
                        return True
                    path.pop()
                    visited.remove(neighbor)
            return False

        return backtrack(start_node)

    def verify(self, G: nx.Graph) -> Tuple[bool, str]:
        # 1. Check if connected
        if not nx.is_connected(G):
            return False, "Graph is not connected. A counterexample must be connected."

        # 2. Check if minimum degree >= 2
        for node, degree in G.degree():
            if degree < 2:
                return False, f"Vertex '{node}' has degree {degree} (less than 2). All vertices must have degree >= 2."

        # 3. Check if NOT Hamiltonian
        if self._has_hamiltonian_cycle(G):
            return False, "Graph contains a Hamiltonian cycle. A counterexample must not contain a Hamiltonian cycle."

        return True, "Valid counterexample! Graph is connected, min degree >= 2, and has no Hamiltonian cycle."
