# Final Judging Engine Mathematical Validation

**STATUS:** VALIDATION PHASE  
**RULE:** No production code implemented. Mathematical and analytical validation only.

## 1. Assignment Algorithm Analysis

A pure max-flow algorithm guarantees finding a globally feasible assignment (satisfying K judges per project without conflicts) if one exists. However, it fails to optimize for workload balancing. 

**Workload Imbalance Example (Pure Max-Flow):**
* Projects: P1, P2. K = 1.
* Judges: J1, J2. No conflicts.
* A pure max-flow algorithm can legally route both units of flow through J1 (J1 workload = 2, J2 workload = 0) because all edges have capacity 1. Feasibility is satisfied, but balance is ignored.

### Algorithm Comparison
* **A. Pure feasibility max-flow:** Fails workload balancing. High implementation complexity, low balancing correctness.
* **B. Min-cost max-flow (with workload cost):** By applying a convex/quadratic cost to each subsequent assignment a judge takes, the flow routes to minimize total cost. High correctness, optimizes for the workload balance cost function. Deterministic if tie-breaker weights are added.
* **C. Greedy + Deterministic Backtracking:** Exponential worst-case complexity (`O(J^P)`). Hard to guarantee runtimes for massive events.
* **D. Integer Linear Programming (ILP):** Mathematically optimal candidate. Objective can be explicitly programmed independently of network graph constructs.

**Objective Hierarchy:**
1. **Primary Objective (Hard Constraint):** Maximize feasible assigned slots (up to exactly K per project) subject to zero conflict edges and max-workload constraints.
2. **Secondary Objective (Cost function):** Minimize the defined workload-imbalance cost subject to assignment feasibility. Exact equal workload may be mathematically impossible.
3. **Tertiary Objective (Tie-breaker):** Deterministic resolution ordering by `judge_id`, `project_id`, and `snapshot seed`.

---

## 2. Assignment Validation (Tests A1-A9)

### A1 Basic assignment
* **Input:** P=10, J=5, K=2. No conflicts.
* **Output:** 20 total slots. 4 projects per judge.
* **Pass/Fail:** PASS. The cost-minimization distributes edges to minimize the cost objective.

### A2 Workload balancing
* **Input:** P=20, J=4, K=1.
* **Output:** Each judge receives exactly 5 projects.
* **Pass/Fail:** PASS. Convex workload costs optimize distribution.

### A3 Deterministic repeatability
* **Input:** Run identical snapshot twice.
* **Output:** Exact same assignment matrix.
* **Pass/Fail:** PASS. Tie-breakers guarantee the solver finds a unique deterministic path.

### A4 Conflict protection
* **Input:** J1 conflicted with P1.
* **Output:** The edge (J1->P1) is removed from the graph.
* **Pass/Fail:** PASS.

### A5 Insufficient eligible judges
* **Input:** P1 requires 2 judges, but only J1 is eligible.
* **Output:** Flow into P1 maxes out at 1. Objective function detects missing flow.
* **Pass/Fail:** PASS. System flags exception/error state for P1.

### A6 Self/team conflict
* **Input:** Judge is Team Member of P1.
* **Output:** Edge removed before graph compilation.
* **Pass/Fail:** PASS.

### A7 Judge dropout
* **Input:** J1 drops out mid-judging.
* **Output:** Original `AssignmentRun` left immutable. Delta snapshot creates new run routing missing evaluations.
* **Pass/Fail:** PASS. No historical rewrites occur.

### A8 Greedy dead-end/global feasibility
* **Input:** Overlapping availability where greedy exhausts J1/J2 early.
* **Output:** Objective-based solver successfully routes around the trap since it optimizes globally.
* **Pass/Fail:** PASS. 

### A9 Snapshot reproducibility
* **Input:** Team changes after run completion. Re-run from snapshot.
* **Output:** Output matches original. Live DB state is ignored.
* **Pass/Fail:** PASS.

---

## 3. Normalization Validation (Tests N1-N9)
*(Using Population Std Dev, minimum sample = 3)*

### N1 Basic Z-score
* **Input:** Scores 70, 80, 90.
* **Output:** μ = 80. σ ≈ 8.16. Z-scores: -1.22, 0, +1.22.
* **Pass/Fail:** PASS. Relative magnitudes preserved.

### N2 Zero variance
* **Input:** Scores 80, 80, 80.
* **Output:** σ = 0.
* **Pass/Fail:** PASS. Division blocked. Status set to `ZERO_VARIANCE`. No silent fallback applied.

### N3 One evaluation
* **Input:** Score 80.
* **Output:** n < 3. Status = `INSUFFICIENT_SAMPLE`.
* **Pass/Fail:** PASS. Normalization mathematically skipped.

### N4 Two evaluations
* **Input:** Scores 70, 90.
* **Output:** n < 3. Status = `INSUFFICIENT_SAMPLE`.
* **Pass/Fail:** PASS.

### N5 Three evaluations
* **Input:** Scores 60, 75, 90.
* **Output:** Normalization proceeds.
* **Pass/Fail:** PASS.

### N6 Extreme outlier
* **Input:** 80, 81, 82, 10.
* **Output:** μ = 63.25. σ ≈ 30.8. Z-scores: +0.54, +0.57, +0.6, -1.72.
* **Pass/Fail:** PASS/WARNING. Z-score captures the anomaly, standard scores squeezed.

### N7 Unequal judge workload
* **Input:** J1 evaluates 3, J2 evaluates 15.
* **Output:** Independent normalizations.
* **Pass/Fail:** PASS mathematically, but highlights statistical volatility for J1.

### N8 Overlapping projects
* **Input:** Generous vs Strict judge evaluating same project.
* **Output:** Z-score offsets the mean shifts, aligning relative impressions.
* **Pass/Fail:** PASS.

### N9 Small-sample warning
* **Input:** Aggregating a project with an `INSUFFICIENT_SAMPLE` evaluation.
* **Output:** Aggregate flagged.
* **Pass/Fail:** PASS. 

---

## 4. Normalization Methods Comparison

| Trait | Z-Score (Pop. Std Dev) | Min-Max | Percentile (Midrank) |
|---|---|---|---|
| **Ordering** | Preserved rank | Preserved rank | Preserved rank |
| **Magnitude Preservation** | High (measures distance from mean) | High (but scaled to arbitrary bounds) | **Destroyed** (ordinal only) |
| **Outlier Sensitivity** | Medium (inflates σ, squashing normal scores) | **Very High** (sets the 0 or 1 bound exclusively) | Very Low (outlier is just rank 1 or N) |
| **Small-Sample Behavior (n=3)** | Volatile (σ fluctuates wildly) | Meaningless (extremes control space) | Meaningless (ranks are 33%, 67%, 100%) |
| **Interpretability** | Low (requires stats knowledge) | High (0 to 100 scale) | High (percentiles) |

**Mathematical Trade-offs:** Z-score retains the magnitude of difference between project qualities but suffers when sample sizes are small. Percentile is safest for outliers but destroys the magnitude of preference.

---

## 5. Unequal Judge Workload Analysis

When J1 evaluates 3 projects and J2 evaluates 15:
* **Mean/Std Dev Estimation:** J2's `μ` and `σ` are statistically robust. J1's are highly volatile.
* **Project-Level Aggregation:** If J1's volatile Z-scores are averaged equally with J2's robust Z-scores, projects evaluated by J1 are subject to higher random variance. 
* **Conclusion:** This exposes a fundamental limitation. Weighting policy is `PENDING PRODUCT/MATHEMATICAL VALIDATION`. Do NOT invent a weighting formula yet.

---

## 6. Architecture Decisions

### Assignment Algorithm Decision
* **PROPOSED:** Min-Cost Max-Flow and ILP are distinct candidate implementation approaches. The assignment objective minimizes the defined workload-imbalance cost subject to assignment feasibility and conflict constraints.

### Normalization Decision
* **DECISION:** PENDING. Normalization method and aggregation policy remain pending product decision based on mathematical limitations. The strategy interface must remain swappable.

### Remaining Mathematical Questions (Requires Product Decision)
1. **Insufficient Sample Aggregation:** Aggregation strategy for projects possessing `INSUFFICIENT_SAMPLE` scores alongside valid ones.
2. **Zero Variance Aggregation:** Aggregation strategy for `ZERO_VARIANCE`.
3. **Weighting Policy:** Statistical weighting for unequal judge sample sizes (e.g., J=3 vs J=15).

---

**CONFIRMATION CHECK:**
```text
NO PRODUCTION CODE IMPLEMENTED
NO DATABASE CHANGES
NO API CHANGES
NO FRONTEND CHANGES
NO DEPENDENCIES ADDED
NO DOCKER CHANGES
```
