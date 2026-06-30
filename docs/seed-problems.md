# Seed Problems

These are the 5 initial graph-theory problems populated in the database.

| ID | Title | False Statement | Predicate Key | Known Min Size | Known Min Object |
|---|---|---|---|---|---|
| 1 | Chromatic $K_4$ Conjecture | "Every graph with chromatic number $\ge 4$ contains $K_4$ as a subgraph." | `chromatic_k4` | 11 vertices | Grötzsch Graph |
| 2 | Planar 3-Coloring | "Every planar graph is 3-colorable." | `planar_3color` | 4 vertices | $K_4$ |
| 3 | Degree-2 Hamiltonian | "Every connected graph with minimum degree $\ge 2$ has a Hamiltonian cycle." | `degree2_hamiltonian` | 5 vertices | Two triangles sharing a vertex |
| 4 | Tree Leaves | "Every tree has exactly two leaves." | `tree_leaves` | 4 vertices | Star graph $K_{1,3}$ |
| 5 | Path vs Cycle Hamiltonian | "Every graph containing a Hamiltonian path also contains a Hamiltonian cycle." | `path_hamiltonian` | 3 vertices | Path graph $P_3$ |
