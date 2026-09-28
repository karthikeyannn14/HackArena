import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Team, Event } from '../../types';
import { teamsApi } from '../../api/teams';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [allTeams, allEvents] = await Promise.all([
          teamsApi.getTeams(),
          eventsApi.getEvents(),
        ]);
        setTeams(allTeams);
        setEvents(allEvents);
      } catch (err) {
        console.error('Failed to load admin teams:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const eventMap: Record<string, string> = {};
  events.forEach(e => {
    eventMap[e.id] = e.title;
  });

  const filtered = teams.filter(t => {
    const q = search.toLowerCase();
    const evTitle = eventMap[t.eventId] || '';
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.leaderName.toLowerCase().includes(q) ||
      evTitle.toLowerCase().includes(q);

    const matchesEvent = eventFilter === 'all' || t.eventId === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const handleExportCSV = () => {
    const headers = ['Team ID', 'Team Name', 'Event Title', 'Leader', 'Members Count', 'Created At'];
    const rows = filtered.map(t => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${(eventMap[t.eventId] || t.eventId).replace(/"/g, '""')}"`,
      `"${t.leaderName}"`,
      t.members.length,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'devpulse_all_teams.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Exported platform teams as CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin" className="hover:text-slate-900">Admin</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Teams Management</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Team Formations</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect multi-team formations, track participation density, and manage squad rosters across all hackathons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              Export All Teams CSV
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by team name or leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-64">
            <Select
              options={[
                { label: 'All Hackathon Events', value: 'all' },
                ...events.map(e => ({ label: e.title, value: e.id })),
              ]}
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Teams Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No teams match query"
                description="No teams found matching search criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Team Name & Description</th>
                    <th className="py-3 px-4">Hackathon Event</th>
                    <th className="py-3 px-4">Team Leader</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{t.name}</div>
                        <div className="text-[11px] font-normal text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                          {t.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <Link to={`/organizer/events/${t.eventId}`} className="hover:underline">
                          {eventMap[t.eventId] || t.eventId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {t.leaderName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {t.members.length} members
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {t.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


