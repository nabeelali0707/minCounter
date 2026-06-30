import pytest
import networkx as nx
from app.verification.predicates.hamiltonian import Degree2HamiltonianPredicate

def test_degree2_hamiltonian_two_triangles():
    # Two triangles sharing a single vertex.
    # Vertices: 0, 1, 2 (triangle 1), 2, 3, 4 (triangle 2)
    # Min degree is 2 (at vertices 0, 1, 3, 4. Vertex 2 has degree 4).
    # Connected, but not Hamiltonian (requires visiting vertex 2 twice to complete cycle).
    # Valid counterexample!
    G = nx.Graph()
    G.add_edges_from([
        (0, 1), (1, 2), (2, 0),
        (2, 3), (3, 4), (4, 2)
    ])
    predicate = Degree2HamiltonianPredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is True
    assert "Valid counterexample" in reason

def test_degree2_hamiltonian_cycle():
    # C5 is connected, min degree 2, and is Hamiltonian.
    # Fails verification (not a counterexample).
    G = nx.cycle_graph(5)
    predicate = Degree2HamiltonianPredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "contains a Hamiltonian cycle" in reason

def test_degree2_hamiltonian_disconnected():
    # Disconnected graph. Fails verification.
    G = nx.Graph()
    G.add_edges_from([(0, 1), (1, 2), (2, 0), (3, 4), (4, 5), (5, 3)])
    predicate = Degree2HamiltonianPredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "not connected" in reason

def test_degree2_hamiltonian_path():
    # Path P5. Min degree is 1 at endpoints. Fails degree check.
    G = nx.path_graph(5)
    predicate = Degree2HamiltonianPredicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "less than 2" in reason
