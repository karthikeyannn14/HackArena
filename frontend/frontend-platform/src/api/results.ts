import { Result } from '../types';
import { db } from './storage';

export interface ResultFilterOptions {
  query?: string;
  trackName?: string;
  status?: string;
}

export const resultsApi = {
  async getResults(eventId?: string, filters?: ResultFilterOptions): Promise<Result[]> {
    await new Promise(r => setTimeout(r, 200));
    let results = db.getResults();

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(r =>
        r.projectTitle.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q) ||
        r.trackName.toLowerCase().includes(q)
      );
    }

    if (filters?.trackName && filters.trackName !== 'all') {
      results = results.filter(r => r.trackName === filters.trackName);
    }

    if (filters?.status && filters.status !== 'all') {
      results = results.filter(r => r.status === filters.status);
    }

    return results;
  },

  async exportResultsCSV(): Promise<string> {
    const results = db.getResults();
    const headers = ['Rank', 'Project Title', 'Team Name', 'Track', 'Final Score', 'Status', 'Awards'];
    const rows = results.map(r => [
      r.rank,
      `"${r.projectTitle.replace(/"/g, '""')}"`,
      `"${r.teamName.replace(/"/g, '""')}"`,
      `"${r.trackName.replace(/"/g, '""')}"`,
      r.finalScore.toFixed(2),
      r.status,
      `"${(r.awards || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};
