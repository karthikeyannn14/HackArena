# Judging Architecture Decision

## CONFIRMED
*Decisions already established by the specification that must be implemented.*

* **Immutable Rubrics:** Rubrics are immutable once judging starts. Changes create new versions.
* **Assignment Snapshots:** Assignment algorithms run against frozen state payloads, never live tables.
* **Assignment Invariants:** Strict adherence to the 10 invariants (Conflict protection, Determinism, etc.).
* **K-Enforcement:** Projects require exactly K judges; shortfalls trigger explicit exception states.
* **Export Strategy:** All CSV exports are generated locally; no cloud dependencies.

## PROPOSED
*Architecture choices recommended for implementation validation, but not yet confirmed.*

* **Globally Feasible Assignment (Approach C):** Using a Max-Flow or Bipartite Matching algorithm to guarantee assignment success (avoiding greedy dead-ends).
* **Z-score Normalization:** Using population standard deviation Z-scores as the primary evaluation equalizer.

## PENDING VALIDATION
*Decisions that MUST NOT be silently invented during coding. Implementation requires explicit resolution.*

1. **Assignment algorithm**
   * *Resolution:* Must be validated by successfully passing test **A8 (Greedy dead-end)**.
2. **Normalization method**
   * *Resolution:* Must be validated by stakeholder review of tests **N1-N9**.
3. **Small-sample aggregation**
   * *Pending:* How to aggregate final project scores when one judge has `n < 3`.
   * *Resolution:* Must be validated by test **N9** and mathematical consensus (whether to isolate or fall back).
4. **Zero-variance aggregation**
   * *Pending:* How to aggregate final project scores when `σ = 0`.
   * *Resolution:* Must be validated by test **N2** and mathematical consensus (whether to output Z=0 or exclude).
5. **Dropout/reassignment behavior**
   * *Pending:* The exact UI and delta-snapshot lifecycle for generating replacement assignments.
   * *Resolution:* Must be validated by test **A7**.

---
*Note: Do not describe a proposed choice as a confirmed final decision. The normalization method remains PENDING VALIDATION unless explicitly approved later.*
