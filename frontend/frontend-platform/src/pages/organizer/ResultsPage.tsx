import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resultsApi } from '../../api/results';
import { eventsApi } from '../../api/events';
import { Result, Event } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const ResultsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'rank' | 'score'>('rank');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const targetEventId = eventId || 'evt_nexus_2026';
        const ev = await eventsApi.getEvent(targetEventId);
        setEvent(ev);

        const data = await resultsApi.getResults(targetEventId, {
          query,
          trackName: trackFilter,
          status: statusFilter,
        });
        setResults(data);
      } finally {
        setIsLoading(false);
      }
    }
    const timer = setTimeout(loadData, 150);
    return () => clearTimeout(timer);
  }, [eventId, query, trackFilter, statusFilter]);

  const handleExportCSV = async () => {
    try {
      const csv = await resultsApi.exportResultsCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `devpulse_results_${eventId || 'nexus'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export Generated', 'Downloaded official results CSV.', 'success');
    } catch {
      showToast('Export failed', 'Unable to create CSV export.', 'error');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'score') return b.finalScore - a.finalScore;
    return a.rank - b.rank;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/organizer" className="hover:text-slate-900 transition-colors">Organizer</Link>
            <span>/</span>
            <Link to="/organizer/events" className="hover:text-slate-900 transition-colors">Events</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Deliberation Results</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Results & Rankings
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Backend-calculated scores, category laurels, and audited judge evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleExportCSV}>
            Export Results (CSV) â­³
          </Button>
          <Link to={`/events/${eventId || 'evt_nexus_2026'}`}>
            <Button variant="outline" size="sm">
              Public Event View
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-4 rounded-lg border border-slate-200">
        <div className="sm:col-span-5">
          <Input
            placeholder="Search by project, team, or track..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            label="Filter Track"
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Tracks' },
              ...(event ? event.tracks.map(t => ({ value: t.name, label: t.name })) : [
                { value: 'AI Infrastructure & Edge Inference', label: 'AI Infrastructure' },
                { value: 'Resilient Distributed Systems', label: 'Resilient Systems' },
                { value: 'Developer Tooling & Verification', label: 'Developer Tooling' },
                { value: 'Open Ecosystem Impact', label: 'Open Ecosystem' },
              ])
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            label="Recognition"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Standings' },
              { value: 'winner', label: 'Grand Winners' },
              { value: 'runner_up', label: 'Runners Up' },
              { value: 'finalist', label: 'Finalists' },
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            label="Sort By"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            options={[
              { value: 'rank', label: 'Official Rank' },
              { value: 'score', label: 'Final Score' },
            ]}
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : sortedResults.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No results match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-center w-16">Rank</th>
                  <th className="px-5 py-3">Project Title</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3 text-right">Audited Score</th>
                  <th className="px-5 py-3">Standing</th>
                  <th className="px-5 py-3">Awards & Recognition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedResults.map(res => (
                  <tr key={res.projectId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">
                      {res.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs">
                          1
                        </span>
                      ) : (
                        `#0${res.rank}`
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-xs">
                      <Link to={`/projects/${res.projectId}`} className="hover:underline">
                        {res.projectTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{res.teamName}</td>
                    <td className="px-5 py-4 text-slate-500">{res.trackName}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 tabular-nums text-sm">
                      {res.finalScore.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {res.awards || 'â€”'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


