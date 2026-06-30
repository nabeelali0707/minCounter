import networkx as nx

def build_graph(graph_data: dict) -> nx.Graph:
    """
    Accepts two formats:
    1. Edge-list format:  { "edges": [[0,1],[1,2],...], "num_vertices": N }
    2. Node/edge format:  { "nodes": [{"id":0},{"id":1}], "edges": [{"source":0,"target":1}] }
    """
    G = nx.Graph()

    # --- Format 1: list-of-lists edges ---
    if "num_vertices" in graph_data:
        n = graph_data.get("num_vertices", 0)
        G.add_nodes_from(range(n))
        for edge in graph_data.get("edges", []):
            if isinstance(edge, (list, tuple)) and len(edge) == 2:
                G.add_edge(edge[0], edge[1])
        return G

    # --- Format 2: node/edge dict (frontend graph editor format) ---
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])

    if not nodes:
        raise ValueError("Graph must contain at least one node.")

    for node in nodes:
        node_id = node.get("id") if isinstance(node, dict) else node
        if node_id is None:
            raise ValueError("All nodes must have an 'id'.")
        G.add_node(node_id)

    for edge in edges:
        if isinstance(edge, dict):
            source = edge.get("source")
            target = edge.get("target")
        elif isinstance(edge, (list, tuple)) and len(edge) == 2:
            source, target = edge[0], edge[1]
        else:
            raise ValueError(f"Invalid edge format: {edge}")

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


def chromatic_number_exact(G: nx.Graph) -> int:
    """
    Exact chromatic number via backtracking. Efficient enough for graphs up to ~30 vertices.
    """
    nodes = list(G.nodes())
    n = len(nodes)
    colors: dict = {}

    def is_safe(node, color):
        return all(colors.get(nbr) != color for nbr in G.neighbors(node))

    def backtrack(idx, num_colors):
        if idx == len(nodes):
            return True
        node = nodes[idx]
        for color in range(num_colors):
            if is_safe(node, color):
                colors[node] = color
                if backtrack(idx + 1, num_colors):
                    return True
                del colors[node]
        return False

    for k in range(1, n + 1):
        colors = {}
        if backtrack(0, k):
            return k
    return n


def has_hamiltonian_cycle(G: nx.Graph) -> bool:
    """Check for a Hamiltonian cycle using backtracking."""
    nodes = list(G.nodes())
    n = len(nodes)
    if n < 3:
        return False
    start = nodes[0]

    def backtrack(path, visited):
        if len(path) == n:
            return path[-1] in G.neighbors(start)
        for nbr in G.neighbors(path[-1]):
            if nbr not in visited:
                visited.add(nbr)
                path.append(nbr)
                if backtrack(path, visited):
                    return True
                path.pop()
                visited.remove(nbr)
        return False

    return backtrack([start], {start})


def has_hamiltonian_path(G: nx.Graph) -> bool:
    """Check for a Hamiltonian path using backtracking."""
    nodes = list(G.nodes())
    n = len(nodes)
    if n == 0:
        return False
    if n == 1:
        return True

    def backtrack(path, visited):
        if len(path) == n:
            return True
        for nbr in G.neighbors(path[-1]):
            if nbr not in visited:
                visited.add(nbr)
                path.append(nbr)
                if backtrack(path, visited):
                    return True
                path.pop()
                visited.remove(nbr)
        return False

    for start in nodes:
        if backtrack([start], {start}):
            return True
    return False
