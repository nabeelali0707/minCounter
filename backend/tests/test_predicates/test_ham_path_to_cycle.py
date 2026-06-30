import pytest
import networkx as nx
from app.verification.predicates.ham_path_to_cycle import HamPathToCyclePredicate

def test_ham_path_to_cycle_path():
    # A simple path P4 has a Hamiltonian path but no cycle.
    # Valid counterexample!
    G = nx.path_graph(4)
    predicate = HamPathToCyclePredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is True
    assert "Valid counterexample" in reason

def test_ham_path_to_cycle_cycle():
    # C4 has both path and cycle. Fails verification.
    G = nx.cycle_graph(4)
    predicate = HamPathToCyclePredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "contains a Hamiltonian cycle" in reason

def test_ham_path_to_cycle_no_path():
    # Two disconnected nodes. No path. Fails.
    G = nx.Graph()
    G.add_nodes_from([0, 1])
    predicate = HamPathToCyclePredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "does not contain a Hamiltonian path" in reason
