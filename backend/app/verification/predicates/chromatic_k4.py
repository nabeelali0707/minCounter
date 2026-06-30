import networkx as nx
from typing import Tuple
from app.verification.base import BaseVerificationPredicate

class ChromaticK4Predicate(BaseVerificationPredicate):
    """
    False statement: "Every graph with chromatic number >= 4 contains K4."
    A valid counterexample must have chromatic number >= 4 AND contain NO K4.
    """
    
    def _is_3_colorable(self, G: nx.Graph) -> bool:
        nodes = list(G.nodes())
        coloring = {}
        
        def backtrack(index: int) -> bool:
            if index == len(nodes):
                return True
            node = nodes[index]
            # Get colors of already colored neighbors
            neighbor_colors = {coloring[n] for n in G.neighbors(node) if n in coloring}
            # Try 3 colors
            for color in range(3):
                if color not in neighbor_colors:
                    coloring[node] = color
                    if backtrack(index + 1):
                        return True
                    del coloring[node]
            return False
            
        return backtrack(0)

    def verify(self, G: nx.Graph) -> Tuple[bool, str]:
        # 1. Check if chromatic number >= 4 (i.e. NOT 3-colorable)
        if self._is_3_colorable(G):
            return False, "Graph is 3-colorable (chromatic number < 4). A counterexample must require at least 4 colors."
            
        # 2. Check if it contains K4 (clique number >= 4)
        # find_cliques returns all maximal cliques
        try:
            cliques = list(nx.find_cliques(G))
            max_clique_size = max(len(c) for c in cliques) if cliques else 0
        except Exception as e:
            # Fallback/safety
            max_clique_size = 0
            
        if max_clique_size >= 4:
            return False, f"Graph contains a K4 (clique of size {max_clique_size} found). A counterexample must not contain K4."
            
        return True, "Valid counterexample! Chromatic number >= 4 (not 3-colorable) and does not contain K4."
