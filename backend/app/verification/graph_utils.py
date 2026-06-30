import networkx as nx
from typing import Dict, Any

def parse_graph_json(graph_data: Dict[str, Any]) -> nx.Graph:
    """
    Parse a JSON representation of a graph into a networkx.Graph.
    Expected structure:
    {
        "nodes": [{"id": 1}, {"id": 2}],
        "edges": [{"source": 1, "target": 2}]
    }
    """
    G = nx.Graph()
    
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])
    
    if not nodes:
        raise ValueError("Graph must contain at least one node.")
        
    for node in nodes:
        node_id = node.get("id")
        if node_id is None:
            raise ValueError("All nodes must have an 'id'.")
        G.add_node(node_id)
        
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source is None or target is None:
            raise ValueError("All edges must have both 'source' and 'target'.")
        if source not in G:
            raise ValueError(f"Edge source '{source}' does not exist in nodes list.")
        if target not in G:
            raise ValueError(f"Edge target '{target}' does not exist in nodes list.")
        if source == target:
            raise ValueError(f"Self-loops are not allowed (edge: {source} -> {target}).")
        G.add_edge(source, target)
        
    return G
