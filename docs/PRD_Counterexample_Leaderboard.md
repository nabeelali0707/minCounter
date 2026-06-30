# Product Requirements Document
## Minimal Counterexample Leaderboard

**Version:** 1.0 (MVP Scope)
**Status:** Approved
**Owner:** Product Team
**Last Updated:** June 30, 2026

---

## 1. Overview
### 1.1 Problem Statement
There is no platform where people compete to find the *smallest or simplest* counterexample to a false mathematical statement. Existing platforms (Project Euler, Codeforces, LeetCode) reward speed or raw correctness on static problem sets, not minimality on a continuously re-rankable leaderboard. Experimental mathematicians, students, and competitive-math enthusiasts currently do this kind of search manually in scripts (Sage, networkx, GAP) with no shared, gamified, or verifiable outlet.

### 1.2 Product Vision
A web platform where users are given false mathematical statements (initially graph-theory based) and compete to submit the smallest valid counterexample. Submissions are automatically verified by a backend engine. Leaderboards re-rank in real time as smaller counterexamples are found, creating a competitive loop around experimental mathematics.

### 1.3 Goals (MVP)
- Launch with 5 curated, pre-verified false statements in graph theory.
- Allow users to submit counterexamples and receive automated pass/fail verification.
- Maintain a public, re-ranking leaderboard per problem, scored by object size (vertex count).
- Show record-progression history so users can see how the minimal counterexample shrank over time.

### 1.4 Non-Goals (MVP)
- Community-submitted problems (deferred to Phase 2).
- Support for non-graph problem types (polynomials, matrices, groups).
- Real-time multiplayer/collaboration features.
- Mobile native app.

---

## 2. Core User Flow
1. User lands on homepage, sees list of active problems with current record holder and record size.
2. User opens a problem: reads the false statement, sees the current minimal counterexample size and a visualization of the current record-holding object.
3. User constructs a candidate object using a graph editor (or raw input: edge list / adjacency matrix).
4. User submits. Backend verification engine checks:
    - The object is well-formed (valid graph).
    - The object genuinely violates the stated (false) property.
5. If valid and smaller than the current record, leaderboard updates immediately; user is credited.
6. If valid but not a new record, submission is logged but does not change leaderboard rank.
7. If invalid, user receives a clear rejection reason (e.g., "this graph does not satisfy chromatic number 4").
8. User can view problem's record-progression chart and submission history.

---

## 3. Functional Requirements
- **Problem Management**: Admin-curated list of problems containing title, statement text, predicate key, size metric, and state.
- **Verification Engine**: Asynchronous execution of graph checkers using networkx.
- **Leaderboard**: Ordered list of record holders, ascending by size.
- **Visualization**: Force-directed layout of the current record graph and line chart of historical records.
- **Authentication**: JWT-based login/signup for code submission attribution.
