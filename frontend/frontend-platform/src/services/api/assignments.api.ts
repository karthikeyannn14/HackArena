import { AssignmentRun, Assignment } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_ASSIGNMENT_RUNS, MOCK_ASSIGNMENTS } from '../mock/judgingData';

function getStoredRuns(): AssignmentRun[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_runs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_ASSIGNMENT_RUNS;
}

function setStoredRuns(runs: AssignmentRun[]) {
  localStorage.setItem('devpulse_mock_engine_runs', JSON.stringify(runs));
}

function getStoredAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_assignments');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_ASSIGNMENTS;
}

function setStoredAssignments(list: Assignment[]) {
  localStorage.setItem('devpulse_mock_engine_assignments', JSON.stringify(list));
}

export const assignmentsApi = {
  async getAssignmentRuns(eventId?: string): Promise<AssignmentRun[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      const runs = getStoredRuns();
      return eventId ? runs.filter(r => r.eventId === eventId) : runs;
    }
    return apiClient<AssignmentRun[]>(eventId ? `/judging/assignments/runs/${eventId}` : '/judging/assignments/runs');
  },

  async triggerAssignmentRun(eventId: string, kValue: number = 3): Promise<AssignmentRun> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 800));
      const runs = getStoredRuns();
      const newRun: AssignmentRun = {
        id: `run_opt_${Date.now()}`,
        eventId,
        algorithmVersion: 'v2.4-mincost-flow-k3',
        kValue,
        status: 'COMPLETED',
        totalAssignments: 15,
        unresolvedProjectsCount: 0,
        unresolvedProjects: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + 3200).toISOString(),
        executionTimeMs: 3200,
      };
      setStoredRuns([newRun, ...runs]);
      return newRun;
    }
    return apiClient<AssignmentRun>(`/judging/events/${eventId}/assignments/run`, {
      method: 'POST',
      body: JSON.stringify({ kValue }),
    });
  },

  async getAssignments(eventId?: string, runId?: string, judgeId?: string, projectId?: string): Promise<Assignment[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      let list = getStoredAssignments();
      if (eventId) list = list.filter(a => a.eventId === eventId);
      if (runId) list = list.filter(a => a.runId === runId);
      return list;
    }
    return apiClient<Assignment[]>(judgeId ? `/judging/judges/${judgeId}/assignments` : `/judging/projects/${projectId}/assignments`);
  },

  async replaceAssignment(params: {
    assignmentId: string;
    newJudgeId: string;
    newJudgeName: string;
    newJudgeEmail: string;
    reason: string;
  }): Promise<Assignment> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 300));
      const list = getStoredAssignments();
      const oldAssignment = list.find(a => a.id === params.assignmentId);
      if (!oldAssignment) throw new Error('Assignment not found');

      // Supersede old assignment
      const newId = `asg_${Date.now()}`;
      oldAssignment.assignmentState = 'SUPERSEDED';
      oldAssignment.supersededBy = newId;
      oldAssignment.supersededReason = params.reason;

      const newAssignment: Assignment = {
        ...oldAssignment,
        id: newId,
        judgeId: params.newJudgeId,
        judgeName: params.newJudgeName,
        judgeEmail: params.newJudgeEmail,
        status: 'NOT_STARTED',
        assignmentState: 'ACTIVE',
        assignedAt: new Date().toISOString(),
        supersededBy: undefined,
        supersededReason: undefined,
        lineage: [
          ...(oldAssignment.lineage || []),
          {
            timestamp: new Date().toISOString(),
            action: 'ASSIGNMENT_REPLACED',
            fromAssignmentId: oldAssignment.id,
            toAssignmentId: newId,
            reason: params.reason,
            actor: 'Platform Organizer',
          },
        ],
      };

      setStoredAssignments([newAssignment, ...list]);
      return newAssignment;
    }

    return apiClient<Assignment>(`/judging/assignments/${params.assignmentId}/replace`, {
      method: 'POST',
      body: JSON.stringify({ newJudgeId: params.newJudgeId, reason: params.reason }),
    });
  }
};


