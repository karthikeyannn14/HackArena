import { MinCostAssignmentStrategy } from '../src/judging/assignment/MinCostAssignmentStrategy';
import { AssignmentSnapshot, JudgeSnapshot, ProjectSnapshot, ConflictSnapshot } from '../src/judging/assignment/types';

describe('MinCostAssignmentStrategy Validation', () => {
  const createSnapshot = (overrides?: Partial<AssignmentSnapshot>): AssignmentSnapshot => ({
    assignmentRunId: 'run-1',
    algorithmVersion: 'MIN_COST_MAX_FLOW_1.0',
    deterministicSeed: 'seed',
    kValue: 1,
    eligibleJudges: [],
    eligibleProjects: [],
    conflicts: [],
    ...overrides
  });

  const createProjects = (count: number): ProjectSnapshot[] => 
    Array.from({ length: count }, (_, i) => ({ projectId: `P${i + 1}`, teamId: `T${i + 1}` }));

  const createJudges = (count: number): JudgeSnapshot[] => 
    Array.from({ length: count }, (_, i) => ({ judgeId: `J${i + 1}` }));

  it('1. Balanced workload with equal eligibility', () => {
    const snapshot = createSnapshot({
      kValue: 2,
      eligibleProjects: createProjects(5), // Total 10 slots
      eligibleJudges: createJudges(5)      // 5 judges -> exactly 2 each
    });

    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    expect(result.unresolvedProjects.length).toBe(0);
    // Workloads should be strictly balanced to 2 each
    result.judgeWorkloads.forEach(w => expect(w.assignedCount).toBe(2));
  });

  it('2. Unequal eligibility (routing around constraints)', () => {
    const snapshot = createSnapshot({
      kValue: 2,
      eligibleProjects: createProjects(3), // 6 slots total
      eligibleJudges: createJudges(3),     // 3 judges
      conflicts: [
        { judgeId: 'J1', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J1', projectId: 'P2', reason: 'DECLARED' }
      ]
    });
    // J1 can only do P3. J2, J3 must handle the rest.
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    const j1Assignments = result.assignments.filter(a => a.judgeId === 'J1');
    expect(j1Assignments.length).toBe(1);
    expect(j1Assignments[0]?.projectId).toBe('P3');
  });

  it('3. Conflict-heavy graph', () => {
    // 3 projects, K=1, 3 judges.
    // J1 conflicted with P2, P3
    // J2 conflicted with P1, P3
    // J3 conflicted with P1, P2
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(3),
      eligibleJudges: createJudges(3),
      conflicts: [
        { judgeId: 'J1', projectId: 'P2', reason: 'DECLARED' },
        { judgeId: 'J1', projectId: 'P3', reason: 'DECLARED' },
        { judgeId: 'J2', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J2', projectId: 'P3', reason: 'DECLARED' },
        { judgeId: 'J3', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J3', projectId: 'P2', reason: 'DECLARED' },
      ]
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        { judgeId: 'J1', projectId: 'P1' },
        { judgeId: 'J2', projectId: 'P2' },
        { judgeId: 'J3', projectId: 'P3' }
      ])
    );
  });

  it('4. Multiple globally optimal solutions & deterministic tie-breaking', () => {
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(2), // P1, P2
      eligibleJudges: createJudges(2)      // J1, J2
    });
    // Both P1->J1, P2->J2 AND P1->J2, P2->J1 are perfectly optimal.
    const strategy = new MinCostAssignmentStrategy();
    const result1 = strategy.assign(snapshot as any);
    const result2 = strategy.assign(snapshot as any);

    expect(result1.isGloballyFeasible).toBe(true);
    expect(result1.assignments).toEqual(result2.assignments); // Deterministic
    
    // Because of sort order, P1->J1 and P2->J2 should be preferred over P1->J2.
    expect(result1.assignments.find(a => a.projectId === 'P1')?.judgeId).toBe('J1');
  });

  it('5. Zero eligible judges', () => {
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(2),
      eligibleJudges: []
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(false);
  });

  it('6. K greater than number of judges', () => {
    const snapshot = createSnapshot({
      kValue: 3,
      eligibleProjects: createProjects(2),
      eligibleJudges: createJudges(2)
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(false);
  });

  it('7. K = 1', () => {
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(2),
      eligibleJudges: createJudges(2)
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    expect(result.assignments.length).toBe(2);
  });

  it('8. K > 1', () => {
    const snapshot = createSnapshot({
      kValue: 3,
      eligibleProjects: createProjects(2),
      eligibleJudges: createJudges(4)
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    expect(result.assignments.length).toBe(6);
  });

  it('9. All judges conflicted with one project', () => {
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(2),
      eligibleJudges: createJudges(2),
      conflicts: [
        { judgeId: 'J1', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J2', projectId: 'P1', reason: 'DECLARED' }
      ]
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(false); // P1 cannot be assigned
    expect(result.unresolvedProjects.length).toBe(2); // Entire assignment aborted
    expect(result.unresolvedProjects.find(p => p.projectId === 'P1')).toBeDefined();
  });

  it('10. Multiple projects competing for the same scarce judge', () => {
    // K=1, 3 projects, 3 judges.
    // J1, J2 only eligible for P3.
    // P1, P2 ONLY eligible for J3.
    // So P1 and P2 both need J3. 
    // J3 can take both. J1 and J2 must take P3.
    // Wait, if J3 takes P1 and P2, workload is 2. 
    // J1 takes P3. J2 takes nothing. This is optimal.
    const snapshot = createSnapshot({
      kValue: 1,
      eligibleProjects: createProjects(3),
      eligibleJudges: createJudges(3),
      conflicts: [
        { judgeId: 'J1', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J1', projectId: 'P2', reason: 'DECLARED' },
        { judgeId: 'J2', projectId: 'P1', reason: 'DECLARED' },
        { judgeId: 'J2', projectId: 'P2', reason: 'DECLARED' },
      ]
    });
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot as any);

    expect(result.isGloballyFeasible).toBe(true);
    
    const j3Workload = result.judgeWorkloads.find(w => w.judgeId === 'J3');
    expect(j3Workload?.assignedCount).toBe(2);
  });

  describe('Benchmarks', () => {
    it('Benchmark: 10 judges / 20 projects (K=2)', () => {
      const snapshot = createSnapshot({
        kValue: 2,
        eligibleProjects: createProjects(20),
        eligibleJudges: createJudges(10)
      });
      const start = Date.now();
      const strategy = new MinCostAssignmentStrategy();
      const result = strategy.assign(snapshot as any);
      const elapsed = Date.now() - start;

      expect(result.isGloballyFeasible).toBe(true);
      console.log(`[Benchmark 10J/20P] Elapsed: ${elapsed}ms`);
      // Just assert it doesn't timeout (Jest defaults to 5000ms)
    });

    it('Benchmark: 50 judges / 200 projects (K=3)', () => {
      const snapshot = createSnapshot({
        kValue: 3,
        eligibleProjects: createProjects(200),
        eligibleJudges: createJudges(50)
      });
      const start = Date.now();
      const strategy = new MinCostAssignmentStrategy();
      const result = strategy.assign(snapshot as any);
      const elapsed = Date.now() - start;

      expect(result.isGloballyFeasible).toBe(true);
      console.log(`[Benchmark 50J/200P] Elapsed: ${elapsed}ms`);
    });
  });
});
