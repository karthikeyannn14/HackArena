import { 
  AssignmentSnapshot, 
  AssignmentStrategy, 
  AssignmentResult,
  ProjectAssignmentStatus,
  JudgeWorkload
} from './types';
import { ConflictChecker } from './ConflictChecker';
import { FeasibilityAnalyzer } from './FeasibilityAnalyzer';

class FlowEdge {
  constructor(
    public to: number,
    public capacity: number,
    public cost: number,
    public rev: number
  ) {}
  public flow: number = 0;
}

class MinCostMaxFlow {
  private V: number;
  private adj: FlowEdge[][];

  constructor(V: number) {
    this.V = V;
    this.adj = Array.from({ length: V }, () => []);
  }

  addEdge(from: number, to: number, capacity: number, cost: number) {
    const adjTo = this.adj[to];
    const adjFrom = this.adj[from];
    if (!adjTo || !adjFrom) return;
    const a = new FlowEdge(to, capacity, cost, adjTo.length);
    const b = new FlowEdge(from, 0, -cost, adjFrom.length);
    adjFrom.push(a);
    adjTo.push(b);
  }

  solve(S: number, T: number): { flow: number, cost: number } {
    let totalFlow = 0;
    let totalCost = 0;

    const dist = new Float64Array(this.V);
    const parentNode = new Int32Array(this.V);
    const parentEdge = new Int32Array(this.V);
    const inQueue = new Uint8Array(this.V);
    
    // Using a dynamic queue array
    const queue: number[] = [];

    while (true) {
      dist.fill(Infinity);
      parentNode.fill(-1);
      parentEdge.fill(-1);
      inQueue.fill(0);

      let head = 0;
      queue.length = 0; // reset queue

      dist[S] = 0;
      queue.push(S);
      inQueue[S] = 1;

      while (head < queue.length) {
        const u = queue[head++]!;
        inQueue[u] = 0;

        const adjU = this.adj[u] || [];
        for (let i = 0; i < adjU.length; i++) {
          const edge = adjU[i]!;
          const distU = dist[u] ?? Infinity;
          const distTo = dist[edge.to] ?? Infinity;
          if (edge.capacity - edge.flow > 0 && distTo > distU + edge.cost) {
            dist[edge.to] = distU + edge.cost;
            parentNode[edge.to] = u;
            parentEdge[edge.to] = i;

            if (!inQueue[edge.to]) {
              queue.push(edge.to);
              inQueue[edge.to] = 1;
            }
          }
        }
      }

      if (dist[T] === Infinity) {
        break; // No more augmenting paths
      }

      let pushFlow = Infinity;
      let curr = T;
      while (curr !== S) {
        const pNode = parentNode[curr]!;
        const pEdgeIdx = parentEdge[curr]!;
        const edge = (this.adj[pNode] || [])[pEdgeIdx]!;
        pushFlow = Math.min(pushFlow, edge.capacity - edge.flow);
        curr = pNode;
      }

      curr = T;
      while (curr !== S) {
        const pNode = parentNode[curr]!;
        const pEdgeIdx = parentEdge[curr]!;
        const edge = (this.adj[pNode] || [])[pEdgeIdx]!;
        const revEdge = (this.adj[curr] || [])[edge.rev]!;
        
        edge.flow += pushFlow;
        revEdge.flow -= pushFlow;
        curr = pNode;
      }

      totalFlow += pushFlow;
      totalCost += pushFlow * (dist[T] ?? 0);
    }

    return { flow: totalFlow, cost: totalCost };
  }

  getPositiveEdges(): { from: number, to: number, flow: number }[] {
    const result = [];
    for (let u = 0; u < this.V; u++) {
      const adjU = this.adj[u] || [];
      for (const edge of adjU) {
        if (edge.capacity > 0 && edge.flow > 0) {
          result.push({ from: u, to: edge.to, flow: edge.flow });
        }
      }
    }
    return result;
  }
}

export class MinCostAssignmentStrategy implements AssignmentStrategy {
  
  assign(snapshot: Readonly<AssignmentSnapshot>): AssignmentResult {
    // 1. Initial Feasibility Sanity Check
    const feasibility = FeasibilityAnalyzer.analyze(snapshot);
    if (!feasibility.isFeasible) {
      return this.buildInfeasibleResult(snapshot, feasibility.reason);
    }

    // 2. Sort explicitly to guarantee deterministic iteration and node mapping
    const judges = [...snapshot.eligibleJudges].sort((a, b) => a.judgeId.localeCompare(b.judgeId));
    const projects = [...snapshot.eligibleProjects].sort((a, b) => a.projectId.localeCompare(b.projectId));

    const M = judges.length;
    const N = projects.length;
    
    // Nodes: S = 0, T = 1, Judges = 2 to 2+M-1, Projects = 2+M to 2+M+N-1
    const S = 0;
    const T = 1;
    const V = 2 + M + N;

    const mcmf = new MinCostMaxFlow(V);
    const conflictChecker = new ConflictChecker(snapshot);

    // 3. Build Graph
    // Edges from S to Judges (Workload cost function)
    // To minimize maximum workload (or strictly balance it), we assign quadratic penalties to each assignment.
    // The marginal cost of the w-th assignment is 2w - 1.
    // This perfectly penalizes placing a 2nd project on a judge compared to placing a 1st project on another judge.
    for (let i = 0; i < M; i++) {
      const judgeNode = 2 + i;
      const maxTheoreticalWorkload = Math.min(N, snapshot.kValue * N); // Cap at N
      for (let w = 1; w <= maxTheoreticalWorkload; w++) {
        const marginalCost = 2 * w - 1;
        mcmf.addEdge(S, judgeNode, 1, marginalCost);
      }
    }

    // Edges from Judges to Projects
    for (let i = 0; i < M; i++) {
      const judge = judges[i];
      if (!judge) continue;
      const judgeNode = 2 + i;
      for (let j = 0; j < N; j++) {
        const project = projects[j];
        if (!project) continue;
        const projectNode = 2 + M + j;
        if (!conflictChecker.hasConflict(judge.judgeId, project.projectId)) {
          // No conflict -> eligible edge with capacity 1, cost 0
          mcmf.addEdge(judgeNode, projectNode, 1, 0);
        }
      }
    }

    // Edges from Projects to T
    for (let j = 0; j < N; j++) {
      const projectNode = 2 + M + j;
      mcmf.addEdge(projectNode, T, snapshot.kValue, 0);
    }

    // 4. Solve Optimization
    const { flow } = mcmf.solve(S, T);

    // 5. Extract Assignments
    const targetFlow = N * snapshot.kValue;
    const isGloballyFeasible = flow === targetFlow;

    const finalAssignments: { projectId: string; judgeId: string }[] = [];
    const edges = mcmf.getPositiveEdges();

    for (const edge of edges) {
      if (edge.from >= 2 && edge.from < 2 + M && edge.to >= 2 + M && edge.to < 2 + M + N) {
        const jIndex = edge.from - 2;
        const pIndex = edge.to - (2 + M);
        const proj = projects[pIndex];
        const jdg = judges[jIndex];
        if (proj && jdg) {
          finalAssignments.push({
            projectId: proj.projectId,
            judgeId: jdg.judgeId
          });
        }
      }
    }

    return this.buildResult(snapshot, isGloballyFeasible, finalAssignments);
  }

  private buildResult(
    snapshot: Readonly<AssignmentSnapshot>, 
    isGloballyFeasible: boolean, 
    assignments: { projectId: string; judgeId: string }[]
  ): AssignmentResult {
    
    const judgeWorkloadsMap = new Map<string, number>();
    snapshot.eligibleJudges.forEach(j => judgeWorkloadsMap.set(j.judgeId, 0));

    const projectStatusesMap = new Map<string, ProjectAssignmentStatus>();
    snapshot.eligibleProjects.forEach(p => {
      projectStatusesMap.set(p.projectId, {
        projectId: p.projectId,
        isResolved: false,
        assignedCount: 0,
        requiredCount: snapshot.kValue,
        missingCount: snapshot.kValue
      });
    });

    for (const a of assignments) {
      judgeWorkloadsMap.set(a.judgeId, judgeWorkloadsMap.get(a.judgeId)! + 1);
      
      const pStat = projectStatusesMap.get(a.projectId)!;
      pStat.assignedCount++;
      pStat.missingCount = pStat.requiredCount - pStat.assignedCount;
      pStat.isResolved = pStat.missingCount === 0;
    }

    const projectStatuses = Array.from(projectStatusesMap.values());
    const unresolvedProjects = projectStatuses.filter(p => !p.isResolved);
    const judgeWorkloads: JudgeWorkload[] = Array.from(judgeWorkloadsMap.entries()).map(([judgeId, assignedCount]) => ({
      judgeId,
      assignedCount
    }));

    return {
      assignmentRunId: snapshot.assignmentRunId,
      algorithmVersion: 'MIN_COST_MAX_FLOW_1.0',
      assignments,
      projectStatuses,
      judgeWorkloads,
      unresolvedProjects,
      deterministicSeedUsed: snapshot.deterministicSeed,
      isGloballyFeasible
    };
  }

  private buildInfeasibleResult(snapshot: Readonly<AssignmentSnapshot>, reason?: string): AssignmentResult {
    return this.buildResult(snapshot, false, []);
  }
}
