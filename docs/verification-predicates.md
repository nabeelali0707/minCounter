# Verification Predicates Specifications

This document outlines how candidate counterexamples are verified for the five seed problems.

## Graph Representation
Graphs are submitted as JSON objects containing:
- `nodes`: List of objects, each with `id` (integer or string).
- `edges`: List of objects, each with `source` and `target` corresponding to node IDs.

Internally, the backend parses this into a `networkx.Graph` (undirected).

---

## 1. Problem: "Every 4-chromatic graph contains K4"
- **Statement**: A graph with chromatic number $\chi(G) \ge 4$ must contain a complete subgraph on 4 vertices ($K_4$).
- **Verification Logic**:
  1. Check if the graph is simple and undirected.
  2. Compute the chromatic number $\chi(G)$. If $\chi(G) < 4$, the graph is **not** a counterexample (fails verification).
  3. Check if $K_4$ is a subgraph of $G$ (clique number $\omega(G) \ge 4$). If $G$ contains a $K_4$, it is **not** a counterexample (fails verification).
  4. If $\chi(G) \ge 4$ and $G$ has no $K_4$, it is a **valid counterexample**.
- **Known Minimal Counterexample**: The Grötzsch Graph ($n=11$ vertices, $m=20$ edges, chromatic number 4, triangle-free, hence no $K_4$).

---

## 2. Problem: "Every planar graph is 3-colorable"
- **Statement**: If a graph can be embedded in the plane without crossing edges, its vertices can be colored using at most 3 colors such that no two adjacent vertices share a color.
- **Verification Logic**:
  1. Check if the graph is planar (using `networkx.check_planarity(G)`). If not planar, it fails.
  2. Compute the chromatic number $\chi(G)$. If $\chi(G) \le 3$, it is not a counterexample.
  3. If planar and $\chi(G) \ge 4$, it is a **valid counterexample**.
- **Known Minimal Counterexample**: The complete graph $K_4$ ($n=4$ vertices, $m=6$ edges, planar, chromatic number 4).

---

## 3. Problem: "Every connected graph with min degree >= 2 is Hamiltonian"
- **Statement**: If a graph is connected and every vertex has degree at least 2, the graph must contain a Hamiltonian cycle (a cycle visiting every vertex exactly once).
- **Verification Logic**:
  1. Check if the graph is connected. If not, it fails.
  2. Check if the degree of every vertex is $\ge 2$. If not, it fails.
  3. Verify whether the graph is **not** Hamiltonian (i.e. does not have a Hamiltonian cycle).
  4. If connected, min degree $\ge 2$, and has **no** Hamiltonian cycle, it is a **valid counterexample**.
- **Known Minimal Counterexample**: Two triangles ($K_3$) sharing a single vertex ($n=5$ vertices, $m=6$ edges, min degree 2, connected, but not Hamiltonian since the shared vertex would need to be visited twice). Another is the Petersen graph ($n=10$, min degree 3, non-Hamiltonian).

---

## 4. Problem: "Every tree has exactly two leaves"
- **Statement**: A tree (connected acyclic graph) has exactly two vertices with degree 1.
- **Verification Logic**:
  1. Check if the graph is a tree (acyclic and connected). If not, it fails.
  2. Count the number of leaves (vertices of degree 1).
  3. If leaf count $\ne 2$, it is a **valid counterexample**.
- **Known Minimal Counterexample**: Star graph $K_{1,3}$ ($n=4$ vertices, 3 leaves).

---

## 5. Problem: "Every graph with a Hamiltonian path is Hamiltonian"
- **Statement**: If a graph contains a path that visits every vertex exactly once, it must also contain a cycle that visits every vertex exactly once.
- **Verification Logic**:
  1. Check if the graph has a Hamiltonian path. If not, it fails.
  2. Check if the graph has a Hamiltonian cycle. If it does, it is not a counterexample.
  3. If it has a Hamiltonian path but **no** Hamiltonian cycle, it is a **valid counterexample**.
- **Known Minimal Counterexample**: A simple path graph $P_3$ ($n=3$ vertices, edges: $(1,2), (2,3)$) has a Hamiltonian path but no cycle.
