# Judging Validation Matrix

This matrix defines the required architectural acceptance tests.

## 1. Assignment (A1-A9)

| ID | Test Name | Input | Expected Result | Invariant Tested | Failure Condition |
|---|---|---|---|---|---|
| **A1** | Basic assignment | Valid snapshot, no conflicts, P=10, J=5, K=2 | All projects receive exactly 2 eligible judges. Workloads balance to ~4 each. | K-Enforcement | Any project has != 2 judges |
| **A2** | Workload balancing | P=20, J=4, K=1 | Each judge receives exactly 5 projects. | Workload Limits | Max workload difference > 1 |
| **A3** | Deterministic repeatability | Snapshot run twice with same seed/IDs | Exact same assignment output both times. | Determinism & Reproducibility | Any assignment differs |
| **A4** | Conflict protection | J1 conflicted with P1 | J1 is not assigned to P1. P1 gets other judges. | Conflict Prevention | J1 assigned to P1 |
| **A5** | Insufficient eligible judges | P1 requires 2 judges, but only J1 is eligible. | P1 triggers exception state; J1 assigned, system flags error. | Fault Isolation | K constraint silently ignored without exception, or conflict assigned to fill |
| **A6** | Self/team conflict | Judge is Team Member of P1 | Judge is implicitly blocked from P1 via relationship snapshot. | Eligibility Guarantee | Judge assigned to own project |
| **A7** | Judge dropout | Judge J1 drops out mid-judging | Historical `AssignmentRun` intact. New Delta run assigns JX to incomplete evaluations. | Historical Integrity | Original assignments deleted or mutated |
| **A8** | Greedy dead-end / global feasibility | Ordering causes early workload cap exhaustion (see Design Doc) | Algorithm successfully bypasses trap (via backtracking or Max-Flow) and globally resolves assignments. | Fault Isolation / K-Enforcement | Algorithm fails and flags impossible despite global feasibility existing |
| **A9** | Snapshot reproducibility | Run assignment, then change team member, run again from old snapshot ID. | Output matches exactly; team member change is ignored for the old run. | Reproducibility | Output alters based on live database state |

## 2. Normalization (N1-N9)

| ID | Test Name | Input | Expected Result | Invariant Tested | Failure Condition |
|---|---|---|---|---|---|
| **N1** | Basic Z-score | Judge scores: 70, 80, 90 | Z-scores calculated as -1, 0, +1 | Mathematical Correctness | Incorrect μ or population σ calculation |
| **N2** | Zero variance | Judge scores: 80, 80, 80 | `normalization_status = ZERO_VARIANCE`. No div by zero. | Zero Variance Handling | Division by zero error or silent raw score substitution |
| **N3** | One evaluation | Judge scores: 80 | `status = INSUFFICIENT_SAMPLE`. No normalization. | Small Sample Policy | Div by zero (σ=0) or pseudo-normalization |
| **N4** | Two evaluations | Judge scores: 70, 90 | `status = INSUFFICIENT_SAMPLE`. No normalization. | Small Sample Policy | Scores output as -1 and +1 |
| **N5** | Three evaluations | Judge scores: 60, 75, 90 | Normalization succeeds. | Small Sample Policy | Marked as insufficient |
| **N6** | Extreme outlier | Judge scores: 80, 81, 82, 10 | Calculates true population σ heavily skewed by 10. | Mathematical Correctness | Outlier discarded without explicit rule |
| **N7** | Unequal judge workload | J1: 3 scores, J2: 20 scores | Both normalized using their own distinct μ and σ. | Independence | J1 scores cross-contaminated by J2 population |
| **N8** | Overlapping projects | P1 judged by J1 (strict) and J2 (generous) | J1 and J2 relative stringency is corrected in their output Z-scores. | Magnitude Preservation | Normalized totals invert true consensus |
| **N9** | Small-sample warning | Final project aggregation includes an `INSUFFICIENT_SAMPLE` score | Aggregate clearly segregates/flags the result according to pending validation rules. | Fault Isolation | Raw and Z-scores mixed implicitly |
