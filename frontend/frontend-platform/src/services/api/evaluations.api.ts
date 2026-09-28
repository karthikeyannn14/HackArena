import { Evaluation } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_EVALUATIONS } from '../mock/judgingData';

function getStoredEvaluations(): Evaluation[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_evaluations');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_EVALUATIONS;
}

function setStoredEvaluations(list: Evaluation[]) {
  localStorage.setItem('devpulse_mock_engine_evaluations', JSON.stringify(list));
}

export const evaluationsApi = {
  async getEvaluations(eventId?: string): Promise<Evaluation[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      const list = getStoredEvaluations();
      return eventId ? list.filter(e => e.eventId === eventId) : list;
    }
    // Backend serves evaluations per assignment, not event. Return all for judge from assignments.
    return apiClient<Evaluation[]>(eventId ? `/judging/judges/${eventId}/evaluations` : '/judging/evaluations');
  },

  async getEvaluation(id: string): Promise<Evaluation | null> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      const list = getStoredEvaluations();
      return list.find(e => e.id === id || e.projectId === id) || null;
    }
    return apiClient<Evaluation>(`/judging/evaluations/${id}`);
  },

  async saveEvaluation(data: Partial<Evaluation> & { projectId: string; judgeId: string }): Promise<Evaluation> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 250));
      const list = getStoredEvaluations();
      const existingIdx = list.findIndex(e => e.projectId === data.projectId && e.judgeId === data.judgeId);
      
      const updated: Evaluation = {
        id: data.id || (existingIdx >= 0 ? list[existingIdx].id : `eval_${Date.now()}`),
        assignmentId: data.assignmentId || `asg_${data.projectId}`,
        eventId: data.eventId || 'evt_nexus_2026',
        judgeId: data.judgeId,
        judgeName: data.judgeName || 'Dr. Marcus Vance',
        projectId: data.projectId,
        scores: data.scores || [],
        totalRawScore: data.totalRawScore || 0,
        totalWeightedScore: data.totalWeightedScore || 0,
        overallFeedback: data.overallFeedback || '',
        status: data.isSubmitted ? 'SUBMITTED' : 'DRAFT',
        isSubmitted: !!data.isSubmitted,
        isReopened: false,
        submittedAt: data.isSubmitted ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        list[existingIdx] = updated;
      } else {
        list.push(updated);
      }
      setStoredEvaluations(list);
      return updated;
    }

    // Map frontend saveEvaluation to backend start+draft+submit flow
    // If data has an assignmentId, use the judging contract:
    const assignmentId = data.assignmentId;
    if (!assignmentId) throw new Error('assignmentId required for real API');
    if (data.isSubmitted) {
      return apiClient<Evaluation>(`/judging/evaluations/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ scores: data.scores }),
      });
    }
    return apiClient<Evaluation>(`/judging/evaluations/${assignmentId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ scores: data.scores }),
    });
  },

  async reopenEvaluation(evaluationId: string, reason: string): Promise<Evaluation> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 300));
      const list = getStoredEvaluations();
      const item = list.find(e => e.id === evaluationId || e.projectId === evaluationId);
      if (!item) throw new Error('Evaluation not found');

      item.isReopened = true;
      item.reopenedAt = new Date().toISOString();
      item.reopenedReason = reason;
      item.status = 'DRAFT';
      item.isSubmitted = false;
      item.updatedAt = new Date().toISOString();

      setStoredEvaluations(list);
      return item;
    }

    return apiClient<Evaluation>(`/judging/evaluations/${evaluationId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
};


