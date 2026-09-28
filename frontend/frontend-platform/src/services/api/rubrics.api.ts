import { RubricDefinition, RubricVersionCriterion } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_RUBRICS } from '../mock/judgingData';

function getStoredRubrics(): Record<string, RubricDefinition> {
  try {
    const raw = localStorage.getItem('devpulse_mock_engine_rubrics');
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_RUBRICS;
}

function setStoredRubrics(rubrics: Record<string, RubricDefinition>) {
  localStorage.setItem('devpulse_mock_engine_rubrics', JSON.stringify(rubrics));
}

export const rubricsApi = {
  async getRubric(eventId: string): Promise<RubricDefinition | null> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 150));
      const rubrics = getStoredRubrics();
      return rubrics[eventId] || rubrics['evt_nexus_2026'] || null;
    }
    // Backend: GET /api/judging/rubrics/:rubricId/published
    // We don't know rubricId from eventId alone; list first approach - return null if not found
    return apiClient<RubricDefinition>(`/judging/rubrics/${eventId}/published`).catch(() => null);
  },

  async createRubricVersion(eventId: string, criteria: RubricVersionCriterion[], changeNotes?: string): Promise<RubricDefinition> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 250));
      const rubrics = getStoredRubrics();
      const def = rubrics[eventId] || rubrics['evt_nexus_2026'];
      const nextVersionNum = Math.max(...def.versions.map(v => v.version)) + 1;
      
      const newVersion = {
        version: nextVersionNum,
        status: 'DRAFT' as const,
        criteria,
        changeNotes: changeNotes || `Draft version ${nextVersionNum}`,
      };

      def.versions.push(newVersion);
      rubrics[eventId] = def;
      setStoredRubrics(rubrics);
      return def;
    }
    return apiClient<RubricDefinition>(`/judging/events/${eventId}/rubrics`, {
      method: 'POST',
      body: JSON.stringify({ name: `Event ${eventId} Rubric`, criteria, changeNotes }),
    });
  },

  async publishRubricVersion(eventId: string, versionNumber: number, publishedBy: string = 'Event Director'): Promise<RubricDefinition> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 300));
      const rubrics = getStoredRubrics();
      const def = rubrics[eventId] || rubrics['evt_nexus_2026'];
      const ver = def.versions.find(v => v.version === versionNumber);
      if (!ver) throw new Error('Rubric version not found');

      ver.status = 'PUBLISHED';
      ver.publishedAt = new Date().toISOString();
      ver.publishedBy = publishedBy;
      def.activeVersion = versionNumber;

      rubrics[eventId] = def;
      setStoredRubrics(rubrics);
      return def;
    }
    return apiClient<RubricDefinition>(`/judging/rubric-versions/${versionNumber}/publish`, {
      method: 'POST',
    });
  }
};


