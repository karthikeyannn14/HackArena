import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Team } from '../../types';
import { eventsApi } from '../../api/events';
import { teamsApi } from '../../api/teams';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const EventTeamsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        const [ev, teamList] = await Promise.all([
          eventsApi.getEvent(eventId),
          teamsApi.getTeams(eventId),
        ]);
        setEvent(ev);
        setTeams(teamList);
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.leaderName.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Team ID', 'Team Name', 'Leader Name', 'Members Count', 'Created Date'];
    const rows = filteredTeams.map(t => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.leaderName}"`,
      t.members.length,
      t.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event?.id || 'event'}_teams.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Exported teams roster as CSV', 'success');
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
        {/* Navigation Breadcrumb & Event Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link to="/organizer" className="hover:text-slate-900">Organizer</Link>
                <span>/</span>
                <Link to="/organizer/events" className="hover:text-slate-900">Events</Link>
                <span>/</span>
                <Link to={`/organizer/events/${eventId}`} className="hover:text-slate-900 font-mono text-[11px]">{eventId}</Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">Teams</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Participating Teams {event ? `— ${event.title}` : ''}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage registered teams, verify member compositions, and export rosters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
          </div>

          {/* Sub-module Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 pt-4 mt-6 text-xs font-medium">
            <Link to={`/organizer/events/${eventId}`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Overview
            </Link>
            <Link to={`/organizer/events/${eventId}/teams`} className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">
              Teams ({teams.length})
            </Link>
            <Link to={`/organizer/events/${eventId}/projects`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Projects
            </Link>
            <Link to={`/organizer/events/${eventId}/submissions`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Submissions
            </Link>
            <Link to={`/organizer/events/${eventId}/judges`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Judges
            </Link>
            <Link to={`/organizer/events/${eventId}/assignments`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Assignments
            </Link>
            <Link to={`/organizer/events/${eventId}/results`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Results
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="w-72">
            <Input
              placeholder="Search by team or leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            Showing {filteredTeams.length} of {teams.length} teams
          </span>
        </div>

        {/* Teams Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filteredTeams.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No teams match your query"
                description="Try clearing search terms or create teams from participant registration."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Team Name</th>
                    <th className="py-3 px-4">Team Leader</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Linked Project</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{t.name}</div>
                        <div className="text-[11px] font-normal text-slate-500 line-clamp-1 max-w-xs">{t.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {t.leaderName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {t.members.length}
                          </span>
                          <span className="text-slate-400">members</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.projectId ? (
                          <Link
                            to={`/projects/${t.projectId}`}
                            className="font-mono text-[11px] text-slate-900 hover:underline bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                          >
                            {t.projectId} ↗
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
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
