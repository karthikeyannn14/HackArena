import { AuditLogEntry, AuditLogAction } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_AUDIT_LOGS } from '../mock/judgingData';

function getStoredLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_audit_logs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_AUDIT_LOGS;
}

export interface AuditLogFilterOptions {
  eventId?: string;
  actor?: string;
  action?: AuditLogAction | 'all';
  entity?: string;
  search?: string;
}

export const auditApi = {
  async getAuditLogs(filters?: AuditLogFilterOptions): Promise<AuditLogEntry[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      let logs = getStoredLogs();

      if (filters?.eventId) {
        logs = logs.filter(l => l.eventId === filters.eventId);
      }
      if (filters?.action && filters.action !== 'all') {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters?.entity) {
        logs = logs.filter(l => l.entity.toLowerCase().includes(filters.entity!.toLowerCase()));
      }
      if (filters?.actor) {
        logs = logs.filter(l => l.actor.toLowerCase().includes(filters.actor!.toLowerCase()));
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        logs = logs.filter(l =>
          l.actor.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q)
        );
      }

      return logs;
    }

    // Backend: GET /api/judging/audit/events/:eventId
    if (filters?.eventId) {
      return apiClient<AuditLogEntry[]>(`/judging/audit/events/${filters.eventId}`);
    }
    if (filters?.actor) {
      return apiClient<AuditLogEntry[]>(`/judging/audit/actors/${filters.actor}`);
    }
    if (filters?.entity) {
      return apiClient<AuditLogEntry[]>(`/judging/audit/entity/${filters.entity}/${filters.entity}`);
    }
    return apiClient<AuditLogEntry[]>('/judging/audit/events/all');
  }
};


