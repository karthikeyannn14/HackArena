import { Judge } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_JUDGES } from '../mock/judgingData';

function getStoredJudges(): Judge[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_judges');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_JUDGES;
}

function setStoredJudges(list: Judge[]) {
  localStorage.setItem('devpulse_mock_engine_judges', JSON.stringify(list));
}

export const judgesApi = {
  async getJudges(eventId?: string): Promise<Judge[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      return getStoredJudges();
    }
    return apiClient<Judge[]>(eventId ? `/judging/events/${eventId}/judges` : '/judging/judges');
  },

  async inviteJudge(data: { eventId: string; judgeId?: string; name: string; email: string; organization: string }): Promise<Judge> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 250));
      const current = getStoredJudges();
      const newJudge: Judge = {
        id: `usr_judge_${Date.now()}`,
        name: data.name,
        email: data.email,
        organization: data.organization,
        status: 'INVITED',
        assignedProjectIds: [],
        completedCount: 0,
        pendingCount: 0,
        conflictsCount: 0,
      };
      setStoredJudges([newJudge, ...current]);
      return newJudge;
    }
    // Backend: POST /api/judging/events/:eventId/judges/:judgeId/invite
    // judgeId here is the Prisma Judge record id (must be pre-created)
    return apiClient<Judge>(`/judging/events/${data.eventId}/judges/${data.judgeId || data.email}/invite`, {
      method: 'POST',
    });
  },

  async suspendJudge(id: string): Promise<Judge> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const current = getStoredJudges();
      const updated = current.map(j => j.id === id ? { ...j, status: 'SUSPENDED' as const } : j);
      setStoredJudges(updated);
      return updated.find(j => j.id === id)!;
    }
    return apiClient<Judge>(`/judging/events/${(arguments as any)[1] || '_'}/judges/${id}/suspend`, { method: 'POST' });
  },

  async reactivateJudge(id: string): Promise<Judge> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const current = getStoredJudges();
      const updated = current.map(j => j.id === id ? { ...j, status: 'ACTIVE' as const } : j);
      setStoredJudges(updated);
      return updated.find(j => j.id === id)!;
    }
    return apiClient<Judge>(`/judging/events/${(arguments as any)[1] || '_'}/judges/${id}/reactivate`, { method: 'POST' });
  },

  async removeJudge(id: string): Promise<boolean> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const current = getStoredJudges();
      const updated = current.map(j => j.id === id ? { ...j, status: 'REMOVED' as const } : j);
      setStoredJudges(updated);
      return true;
    }
    return apiClient<boolean>(`/judging/events/${(arguments as any)[1] || '_'}/judges/${id}`, { method: 'DELETE' });
  }
};


