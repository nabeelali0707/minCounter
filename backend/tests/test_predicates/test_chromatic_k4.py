import pytest
import networkx as nx
from app.verification.predicates.chromatic_k4 import ChromaticK4Predicate

def test_chromatic_k4_grotzsch():
    # The Grötzsch graph is the smallest triangle-free graph with chromatic number 4.
    # It has 11 vertices and 20 edges. It has no triangles (hence no K4) and has chromatic number 4.
    # It is a valid counterexample.
    G = nx.mycielski_graph(4) # Mycielski 4 is the Grötzsch graph
    predicate = ChromaticK4Predicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is True
    assert "Valid counterexample" in reason

def test_chromatic_k4_k4():
    # K4 has chromatic number 4, but it contains K4. Fails verification.
    G = nx.complete_graph(4)
    predicate = ChromaticK4Predicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "contains a K4" in reason

def test_chromatic_k4_cycle():
    # C5 requires 3 colors. Fails verification because chromatic number < 4.
    G = nx.cycle_graph(5)
    predicate = ChromaticK4Predicate()
    is_valid, reason = predicate.verify(G)
    assert is_valid is False
    assert "3-colorable" in reason
