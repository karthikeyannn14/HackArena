# Judging Assignment Design

**Status:** DESIGN & VALIDATION PHASE  
**Rule Constraints:** No implementation, API, DB schema, or application code exists.

## 1. Overview
This document details the architectural design for the Judging Assignment Engine. The engine matches judges to projects based on workload, conflict constraints, and strict eligibility requirements, specifically addressing global assignment feasibility.

## 2. Assignment Engine Design

The architecture defines the mathematical optimization objective independently of the implementation technology.

### Assignment Objective
1. **Hard Constraints:**
   * No conflict assignments allowed.
   * No duplicate judge-project assignments.
   * Each project receives exactly K judges when feasible.
   * Only eligible judges can be assigned.
   * Assignments strictly derive from the immutable snapshot.
2. **Optimization Objective:**
   * The assignment objective minimizes the defined workload-imbalance cost subject to assignment feasibility and conflict constraints.
   * *Note: Exact equal workload may be mathematically impossible because of conflicts, eligibility constraints, K, project/judge counts, and judge availability. The algorithm should optimize the specified objective rather than claim mathematically perfect equality.*
3. **Deterministic Tie-Breaking:**
   * Equal-cost solutions must be resolved deterministically using fixed secondary identifiers (e.g., `judge_id`, `project_id`, `snapshot seed`).

### Candidate Implementation Approaches
* **Approach A: Simple Greedy** - Prone to local capacity failures.
* **Approach B: Greedy + Deterministic Backtracking** - Correct, but exponential worst-case complexity `O(J^P)`.
* **Approach C: Min-Cost Max-Flow** - A candidate implementation approach that routes assignments through a network graph with quadratic capacity costs to minimize the objective function.
* **Approach D: Integer Linear Programming (ILP)** - A candidate implementation approach that models the explicit mathematical objective and constraints directly.

*(Note: Min-Cost Max-Flow and ILP are distinct candidate implementation approaches. The final choice depends on complexity and runtime benchmarking).*

---

## 3. The Greedy Dead-End Scenario (Mathematical Analysis)

Consider a scenario where `eligible_judges(project) >= K` holds for all projects, but a greedy assignment leads to a dead-end.

**Parameters:** 4 Projects (P1-P4), 4 Judges (J1-J4), K = 2, Max workload = 2 per judge.
**Conflicts:** P1 & P2 only allow J1, J2. P3 & P4 allow all J1-J4.
*(Every project independently has at least 2 eligible judges).*

**Greedy Dead-End Execution (Suppose Ordered P3, P4, P1, P2):**
1. **P3:** Assigns J1, J2. Workloads: J1=1, J2=1.
2. **P4:** Assigns J1, J2 (via lowest-ID tie-breaking). Workloads: J1=2, J2=2.
3. **P1:** Needs 2 judges. Only J1, J2 are eligible. 
   **DEAD-END:** J1 and J2 are at max capacity. J3, J4 are conflicted. Greedy fails globally despite local feasibility.

---

## 4. Assignment Invariants

Implementation MUST never violate:
1. Every assigned judge is eligible.
2. No conflict is assigned.
3. Each project receives exactly K judges unless explicitly marked as exception.
4. A judge's workload is tracked correctly.
5. Assignment is deterministic.
6. Assignment is reproducible from the same snapshot.
7. No duplicate judge-project assignment.
8. Insufficient eligibility never causes a conflict violation.
9. Assignment changes are auditable.
10. Original assignments remain historically recoverable after reassignment.

---

## 5. Assignment Snapshot

The system must capture a deterministic snapshot at assignment-run start:
* **Included:** `assignment_run_id`, `timestamp`, `algorithm_version`, `K`, `project_ids`, `judge_ids`, `project/team relationships`, `judge/team relationships`, `declared conflicts`, `prohibited relationships`, `eligibility state`, `relevant event configuration`, `relevant track configuration`, `relevant judging configuration`.
* **What is frozen:** All variables impacting feasibility, eligibility, and conflicts.
* **Why it is frozen:** To prevent real-time changes (e.g., team updates) from silently altering or invalidating the execution of the deterministic algorithm.
* **How:** Serialized to an immutable payload attached to the AssignmentRun.

---

## 6. Dropout / Reassignment Architecture

When a judge drops out or is removed from a project, the following behavior is mandated:

* **Submitted Evaluations from a Dropped Judge:** Must be retained and permanently locked. They are historical fact.
* **Draft Evaluations:** Must be abandoned/deleted or explicitly marked as superseded, since they are incomplete.
* **Historical Assignment Records:** The original `Assignment` record must be left intact but its status changed (e.g., to `SUPERSEDED` or `DROPPED`). No historical record rewriting is allowed.
* **Replacement Judge Selection:** Must be performed against the *current* eligibility and conflict snapshot (since time has passed), selecting deterministically based on lowest workload cost function, or explicitly via manual organizer assignment.
* **AssignmentRun Generation:** Reassignment creates a *new* AssignmentRun (e.g., typed as a `REPAIR` or `DELTA` run).
* **Preservation of the Original AssignmentRun:** The original AssignmentRun is absolutely preserved and never mutated to reflect the new delta run.
* **Audit Trail:** Explicit audit events (`JUDGE_DROPOUT`, `ASSIGNMENT_REPLACED`, `ASSIGNMENT_RUN_CREATED` for delta) must be recorded.

---

## 7. Assignment Engine Foundation (Phase 1B Contracts)

The engine is built on a clean, replaceable architecture:
`AssignmentSnapshot -> AssignmentStrategy -> AssignmentResult -> persistence`

### 7.1 Assignment Input Contract
The input is a strictly typed `AssignmentSnapshot` containing all information required for the algorithm, completely decoupled from database queries during execution. It includes:
* `assignmentRunId`, `algorithmVersion`, `deterministicSeed`, `kValue`
* `eligibleJudges`: Array of judge metadata (ID, team association)
* `eligibleProjects`: Array of project metadata (ID, team association)
* `conflicts`: Array of explicit conflict metadata

### 7.2 Conflict Model
A deterministic `ConflictChecker` evaluates ineligibility based on documented hard constraints:
* Judge's own project or own team
* Declared conflicts
* Prohibited relationships
* No additional arbitrary conflict categories are permitted.

### 7.3 Strategy Abstraction
The engine relies on a swappable interface:
`AssignmentStrategy.assign(snapshot: AssignmentSnapshot): AssignmentResult`
The interface is fundamentally agnostic to the underlying optimization technology. 

**Current Optimization Decision Status:**
* Assignment Strategy: **PROPOSED** (Candidate approaches: Min-Cost Max-Flow, ILP. The final algorithm is pending Phase 2).

### 7.4 Result Model & Unresolved Behavior
The strategy returns an `AssignmentResult` detailing:
* The specific judge-to-project `assignments`.
* Statuses of all projects (`isResolved`, `missingCount`).
* Workload tracking per judge.
* Global feasibility boolean.

**Unresolved Project Behavior:** If K eligible judges cannot be assigned while respecting hard constraints, the project receives fewer than K judges and is explicitly flagged as `unresolved`. A project must never silently violate a conflict rule just to reach K.

### 7.5 Determinism Rules
The engine guarantees determinism. Identical snapshots and seeds must produce identical results.
* All decisions and tie-breakers must use stable identifiers (e.g., `judgeId`, `projectId`).
* Random UUID ordering, current timestamps, or implicit JS iteration orders are strictly forbidden from altering logic.

---

## 8. Strategy Implementation (Phase 2 Candidate)

**CURRENT IMPLEMENTATION CANDIDATE** (Not the final architecture decision until validation/benchmarking is completed).

We implemented the `MinCostAssignmentStrategy` satisfying the `AssignmentStrategy` interface. 

### 8.1 Graph Formulation
The algorithm models assignment as a Successive Shortest Path (SSP) resolution of Min-Cost Max-Flow:
* **Nodes:** Source (S), Sink (T), Judges (J), Projects (P).
* **Edges S -> J:** Multiple parallel edges representing dynamic workload cost margins.
* **Edges J -> P:** Added unconditionally if no explicit conflict exists (Capacity 1, Cost 0).
* **Edges P -> T:** (Capacity K, Cost 0) to demand exactly K judges per project.

### 8.2 Workload Cost Function
To minimize workload imbalance rather than forcing mathematical equality, we emit dynamically generated edges from `S` to each `Judge`. The marginal cost of assigning the *w*-th project to a judge is `2w - 1`. This effectively minimizes the sum of squared workloads, heavily penalizing assigning a heavily-loaded judge when an idle judge is available.

### 8.3 Feasibility Model
The strategy safely guards against invalid partial assignments. If the optimized network flow is strictly less than `N * K`, global feasibility fails. The result sets `isGloballyFeasible = false`, abandoning any persisted assignments, while structurally mapping unresolved projects to explicitly report the system state.

### 8.4 Deterministic Tie-Breaking
The graph strictly forces reproducible tie-breaking. Before edges are loaded into the adjacency matrix, all `Projects` and `Judges` are sorted explicitly by their string IDs. When equal cost shortest paths exist, the deterministic order of iteration guarantees that the algorithm processes lower-ID projects/judges first. 

### 8.5 Complexity & Limitations
* **Complexity:** Successive Shortest Path via SPFA resolves bounded flows effectively in $O(F \cdot E)$, where flow $F = N \cdot K$. In JS, a heavy dataset of 50 Judges and 200 Projects successfully routes in roughly 1 second.
* **Known Limitations:** For exceedingly large arrays (e.g., thousands of judges), $O(F \cdot E)$ could lag in single-threaded Node.js environments. Furthermore, if K scales arbitrarily high, capacity scaling could necessitate moving to a Network Simplex or cycle-canceling optimizer.

---

## 9. Service Layer Integration (Phase 2)

The engine bridges the immutable strategy and the PostgreSQL database using a dedicated transactional Service Layer (`AssignmentService.ts` and `AssignmentSnapshotBuilder.ts`). 

### 9.1 Flow Architecture

The assignment generation strictly follows this execution path:
1. **Request & Authorization Boundary:** An authenticated identity (Admin/Organizer) initiates a generation request (Judges and standard Participants are strictly forbidden). The `actorId` is passed explicitly into the service boundary.
2. **Idempotency Protection:** The service evaluates whether a finalized/running assignment run already exists. Duplicate execution requires an explicit override (`forceNewRun`).
3. **Snapshot Builder:** `AssignmentSnapshotBuilder` retrieves Projects, Judges, and Conflicts. It guarantees structural determinism by mapping relationships (e.g. implicitly checking a Judge's `teamId` against a Project's `teamId`) and strictly sorting the lists by entity ID before generating an immutable snapshot payload.
4. **Pure Strategy Execution:** The loaded `AssignmentSnapshot` is passed into `MinCostAssignmentStrategy` entirely in-memory, divorced from Prisma mutations or dynamic data lookups.
5. **Atomic Transaction Boundary:** 
    - Upon receiving the result, the service initiates a single Prisma `$transaction`.
    - It creates the `AssignmentRun` record.
    - If successful, it bulk inserts all `Assignment` tuples (`ACTIVE`).
    - If the user forced an override, prior runs and their assignments are atomically set to `SUPERSEDED`.
6. **Audit Execution:** The same transaction commits standard `AuditLog` events (`ASSIGNMENT_RUN_CREATED` or `ASSIGNMENT_BLOCKED`).

### 9.2 Transaction Rollback & Failure Behavior
If the transaction faults or database constraints are violated (e.g., foreign key errors, unique constraint collisions), the transaction safely rolls back entirely. It is mathematically impossible to persist a partially committed `COMPLETED` run missing subset assignments.

### 9.3 Infeasibility Handling
If the strategy explicitly returns `isGloballyFeasible = false`, the transaction structurally declines to emit any `Assignment` records. The `AssignmentRun` is marked natively as `FAILED` (or `COMPLETED_WITH_EXCEPTIONS` if partial resolution is strategically authorized by contract), and an `ASSIGNMENT_BLOCKED` audit is emitted. 

### 9.4 Snapshot Immutability
The exact configuration used at generation (including random seeds, explicit `kValue`, generated structural states) is serialized verbatim into the `AssignmentRun.snapshotPayload` JSON column. Historical runs are categorically immutable to preserve exact contest auditing.
