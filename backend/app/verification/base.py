from abc import ABC, abstractmethod
from typing import Tuple
import networkx as nx

class BaseVerificationPredicate(ABC):
    @abstractmethod
    def verify(self, G: nx.Graph) -> Tuple[bool, str]:
        """
        Verify if the given graph is a VALID counterexample.
        Returns:
            Tuple[bool, str]: (is_valid, reason)
            - is_valid: True if the graph is a valid counterexample (violates the claim), False otherwise.
            - reason: A description of why it passed or failed verification.
        """
        pass

    def get_size(self, G: nx.Graph) -> int:
        """
        Returns the size of the graph based on the problem's metric.
        Default is the number of vertices.
        """
        return G.number_of_nodes()
