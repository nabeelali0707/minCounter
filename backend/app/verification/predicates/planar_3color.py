import networkx as nx
from typing import Tuple
from app.verification.base import BaseVerificationPredicate

class Planar3ColorPredicate(BaseVerificationPredicate):
    """
    False statement: "Every planar graph is 3-colorable."
    A valid counterexample must be planar AND require >= 4 colors (NOT 3-colorable).
    """

    def _is_3_colorable(self, G: nx.Graph) -> bool:
        nodes = list(G.nodes())
        coloring = {}
        
        def backtrack(index: int) -> bool:
            if index == len(nodes):
                return True
            node = nodes[index]
            neighbor_colors = {coloring[n] for n in G.neighbors(node) if n in coloring}
            for color in range(3):
                if color not in neighbor_colors:
                    coloring[node] = color
                    if backtrack(index + 1):
                        return True
                    del coloring[node]
            return False
            
        return backtrack(0)

    def verify(self, G: nx.Graph) -> Tuple[bool, str]:
        # 1. Check if planar
        is_planar, _ = nx.check_planarity(G)
        if not is_planar:
            return False, "Graph is not planar. A counterexample must be embeddable in the plane."

        # 2. Check if NOT 3-colorable (chromatic number >= 4)
        if self._is_3_colorable(G):
            return False, "Graph is 3-colorable. A counterexample must require at least 4 colors."

        return True, "Valid counterexample! Graph is planar but requires at least 4 colors."
