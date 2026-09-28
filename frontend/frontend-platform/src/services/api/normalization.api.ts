import { NormalizationResult, ProjectAggregationResult } from '../../types';
import { apiClient, USE_MOCK_API } from './client';
import { MOCK_NORMALIZATION_RESULTS, MOCK_PROJECT_AGGREGATIONS } from '../mock/judgingData';

export const normalizationApi = {
  async getNormalizationResults(eventId?: string): Promise<NormalizationResult[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_NORMALIZATION_RESULTS;
    }
    // Backend doesn't have a list endpoint; return aggregated results instead
    return apiClient<NormalizationResult[]>(eventId ? `/judging/events/${eventId}/aggregated-scores` : '/judging/aggregated-scores');
  },

  async getProjectAggregations(eventId?: string): Promise<ProjectAggregationResult[]> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_PROJECT_AGGREGATIONS;
    }
    return apiClient<ProjectAggregationResult[]>(eventId ? `/judging/events/${eventId}/aggregated-scores` : '/judging/aggregated-scores');
  },

  async triggerNormalizationRun(eventId: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 600));
      return {
        success: true,
        message: 'Backend Z-score normalization and Bayesian project aggregation run completed successfully.',
      };
    }
    return apiClient<{ success: boolean; message: string }>(`/judging/events/${eventId}/normalize`, {
      method: 'POST',
    });
  }
};
