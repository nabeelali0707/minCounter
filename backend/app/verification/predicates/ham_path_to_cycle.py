import networkx as nx
from typing import Tuple
from app.verification.base import BaseVerificationPredicate

class HamPathToCyclePredicate(BaseVerificationPredicate):
    """
    False statement: "Every graph containing a Hamiltonian path also contains a Hamiltonian cycle."
    A valid counterexample must have a Hamiltonian path but NO Hamiltonian cycle.
    """

    def _has_hamiltonian_path(self, G: nx.Graph) -> bool:
        n = G.number_of_nodes()
        if n == 0:
            return False
        if n == 1:
            return True
        nodes = list(G.nodes())
        visited = set()

        def backtrack(curr, count) -> bool:
            if count == n:
                return True
            for neighbor in G.neighbors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    if backtrack(neighbor, count + 1):
                        return True
                    visited.remove(neighbor)
            return False

        for start_node in nodes:
            visited.add(start_node)
            if backtrack(start_node, 1):
                return True
            visited.remove(start_node)
        return False

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
        # 1. Check if it has a Hamiltonian path
        if not self._has_hamiltonian_path(G):
            return False, "Graph does not contain a Hamiltonian path. A counterexample must have a path visiting all vertices."

        # 2. Check if it has NO Hamiltonian cycle
        if self._has_hamiltonian_cycle(G):
            return False, "Graph contains a Hamiltonian cycle. A counterexample must have a Hamiltonian path but no cycle."

        return True, "Valid counterexample! Graph has a Hamiltonian path but no Hamiltonian cycle."
