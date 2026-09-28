import { JudgeConflict, JudgeConflictReason } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_CONFLICTS } from '../mock/judgingData';

function getStoredConflicts(): JudgeConflict[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_conflicts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_CONFLICTS;
}

function setStoredConflicts(list: JudgeConflict[]) {
  localStorage.setItem('devpulse_mock_engine_conflicts', JSON.stringify(list));
}

export const conflictsApi = {
  async getConflicts(eventId?: string): Promise<JudgeConflict[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      const list = getStoredConflicts();
      return eventId ? list.filter(c => c.eventId === eventId) : list;
    }
    // Backend: conflicts are tied to judgeId+projectId; no event-level list endpoint exists
    return apiClient<JudgeConflict[]>(eventId ? `/judging/events/${eventId}/judges` : '/judging/judges');
  },

  async declareConflict(data: {
    eventId: string;
    judgeId: string;
    judgeName: string;
    judgeEmail: string;
    projectId: string;
    projectTitle: string;
    reason: JudgeConflictReason;
    notes?: string;
  }): Promise<JudgeConflict> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const current = getStoredConflicts();
      const newConflict: JudgeConflict = {
        id: `cnf_${Date.now()}`,
        eventId: data.eventId,
        judgeId: data.judgeId,
        judgeName: data.judgeName,
        judgeEmail: data.judgeEmail,
        projectId: data.projectId,
        projectTitle: data.projectTitle,
        reason: data.reason,
        status: 'ACTIVE',
        declaredAt: new Date().toISOString(),
        notes: data.notes,
      };
      setStoredConflicts([newConflict, ...current]);
      return newConflict;
    }
    // Backend: POST /api/judging/projects/:projectId/judges/:judgeId/conflict
    return apiClient<JudgeConflict>(`/judging/projects/${data.projectId}/judges/${data.judgeId}/conflict`, {
      method: 'POST',
      body: JSON.stringify({ reason: data.reason }),
    });
  },

  async resolveConflict(conflictId: string): Promise<JudgeConflict> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const current = getStoredConflicts();
      const updated = current.map(c => 
        c.id === conflictId 
          ? { ...c, status: 'RESOLVED' as const, resolvedAt: new Date().toISOString() } 
          : c
      );
      setStoredConflicts(updated);
      return updated.find(c => c.id === conflictId)!;
    }
    // Backend: DELETE /api/judging/conflicts/:conflictId
    return apiClient<JudgeConflict>(`/judging/conflicts/${conflictId}`, {
      method: 'DELETE',
    });
  }
};


