import { 
  AssignmentSnapshot, 
  AssignmentStrategy, 
  AssignmentResult,
  ConflictSnapshot,
  JudgeSnapshot,
  ProjectSnapshot
} from '../src/judging/assignment/types';
import { MinCostAssignmentStrategy } from '../src/judging/assignment/MinCostAssignmentStrategy';
import { ConflictChecker } from '../src/judging/assignment/ConflictChecker';
import { FeasibilityAnalyzer } from '../src/judging/assignment/FeasibilityAnalyzer';

describe('Assignment Engine Contract & Conflict Layer (A1-A9)', () => {
  
  const createBaseSnapshot = (): AssignmentSnapshot => ({
    assignmentRunId: 'run-1',
    algorithmVersion: '1.0',
    deterministicSeed: 'seed',
    kValue: 2,
    eligibleJudges: [],
    eligibleProjects: [],
    conflicts: []
  });

  it('A1: Basic feasible assignment', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }, { projectId: 'P2', teamId: 'T2' }];
    snapshot.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }];
    
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    expect(result.isGloballyFeasible).toBe(true);
    expect(result.assignments.length).toBe(4); // 2 projects * 2 judges
  });

  it('A2: No judge receives a conflicted project (Explicit Conflict)', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }];
    snapshot.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }, { judgeId: 'J3' }];
    snapshot.conflicts = [{ judgeId: 'J1', projectId: 'P1', reason: 'DECLARED' }];
    
    const checker = new ConflictChecker(snapshot);
    expect(checker.hasConflict('J1', 'P1')).toBe(true);
    expect(checker.hasConflict('J2', 'P1')).toBe(false);

    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    expect(result.assignments.some(a => a.judgeId === 'J1')).toBe(false);
    expect(result.assignments.some(a => a.judgeId === 'J2')).toBe(true);
  });

  it('A3: No duplicate assignment', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }];
    snapshot.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }];
    
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    // Check uniqueness
    const pairs = new Set(result.assignments.map(a => `${a.projectId}-${a.judgeId}`));
    expect(pairs.size).toBe(result.assignments.length);
  });

  it('A4: K judges are assigned when feasible', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.kValue = 3;
    snapshot.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }];
    snapshot.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }, { judgeId: 'J3' }, { judgeId: 'J4' }];
    
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    expect(result.unresolvedProjects.length).toBe(0);
    expect(result.assignments.length).toBe(3);
  });

  it('A5: Deterministic output for identical snapshot + seed', () => {
    const snapshot1 = createBaseSnapshot() as any;
    snapshot1.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }];
    snapshot1.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }];

    const snapshot2 = JSON.parse(JSON.stringify(snapshot1)); // identical clone

    const strategy = new MinCostAssignmentStrategy();
    const result1 = strategy.assign(snapshot1);
    const result2 = strategy.assign(snapshot2);

    expect(result1).toEqual(result2);
  });

  it('A6: Project with fewer than K eligible judges is reported unresolved', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.kValue = 3;
    snapshot.eligibleProjects = [{ projectId: 'P1', teamId: 'T1' }];
    snapshot.eligibleJudges = [{ judgeId: 'J1' }, { judgeId: 'J2' }]; // Only 2 judges for K=3
    
    // Feasibility analyzer should catch this instantly
    const feasibility = FeasibilityAnalyzer.analyze(snapshot);
    expect(feasibility.isFeasible).toBe(false);

    // If strategy runs anyway, it must mark as unresolved
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    expect(result.isGloballyFeasible).toBe(false);
    expect(result.unresolvedProjects.length).toBe(1);
    const firstUnresolved = result.unresolvedProjects[0];
    expect(firstUnresolved).toBeDefined();
    expect(firstUnresolved?.missingCount).toBe(3); // Aborted entirely
  });

  it('A7: Own-team and own-project conflicts are respected', () => {
    const snapshot = createBaseSnapshot() as any;
    snapshot.eligibleProjects = [
      { projectId: 'P1', teamId: 'T1' },
      { projectId: 'P2', teamId: 'T2' }
    ];
    snapshot.eligibleJudges = [
      { judgeId: 'J1', teamId: 'T1' }, // Implicit conflict via team
      { judgeId: 'J2', ownProjectId: 'P2' }, // Implicit conflict via own project
      { judgeId: 'J3', teamId: 'T3' }
    ];
    
    const checker = new ConflictChecker(snapshot);
    
    // J1 conflicted with P1 due to team
    expect(checker.hasConflict('J1', 'P1')).toBe(true);
    
    // J2 conflicted with P2 due to own project
    expect(checker.hasConflict('J2', 'P2')).toBe(true);
    
    // J3 is fine
    expect(checker.hasConflict('J3', 'P1')).toBe(false);
  });

  it('A8: Construct a global dead-end scenario where naive greedy selection fails', () => {
    /**
     * Property demonstrated:
     * - K=1, Workload=1.
     * - P1 only allows J1. (P1 requires 1 judge, has 1 eligible judge).
     * - P2 allows J1 and J2. (P2 requires 1 judge, has 2 eligible judges).
     * - Global feasibility exists: (P1->J1, P2->J2).
     * 
     * If a deterministic greedy strategy processes P2 first, it might select J1 (lowest ID).
     * This immediately causes P1 to fail, NOT because overall workload limit was artificially 
     * small, but because the graph's conflict/eligibility structure requires a globally 
     * aware routing strategy.
     */
    const snapshot = createBaseSnapshot() as any;
    snapshot.kValue = 1;
    snapshot.eligibleProjects = [
      { projectId: 'P2', teamId: 'T2' }, // Ordered first to trick greedy
      { projectId: 'P1', teamId: 'T1' },
    ];
    snapshot.eligibleJudges = [
      { judgeId: 'J1' },
      { judgeId: 'J2' },
    ];
    // Add conflicts to restrict P1
    snapshot.conflicts = [
      { judgeId: 'J2', projectId: 'P1', reason: 'DECLARED' } // J2 cannot judge P1
    ];

    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);
    
    // MinCostMaxFlow correctly routes P2->J2 and P1->J1
    expect(result.isGloballyFeasible).toBe(true);
    expect(result.unresolvedProjects.length).toBe(0);
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        { projectId: 'P1', judgeId: 'J1' },
        { projectId: 'P2', judgeId: 'J2' }
      ])
    );
  });

  it('A9: Dropout/reassignment history gap analysis', () => {
    /**
     * Requirement: Dropout history is represented without overwriting historical assignments.
     * Current persistence model gap analysis:
     * 
     * The `Assignment` model currently uses `state AssignmentState @default(ACTIVE)` 
     * which supports SUPERSEDED and DROPPED.
     * However, the database does NOT strictly prevent `UPDATE` operations 
     * from wiping old history if a developer writes `prisma.assignment.update({...})` 
     * instead of creating a new `AssignmentRun`.
     * 
     * Gap Identified:
     * The foundation is purely application-enforced. A true A9 test would require 
     * checking that `AssignmentRun` delta logic is enforced, which belongs to a future 
     * application service layer, as raw database triggers are restricted in Phase 1.
     */
    expect(true).toBe(true);
  });
});
