import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Submission, Project } from '../../types';
import { eventsApi } from '../../api/events';
import { submissionsApi } from '../../api/submissions';
import { projectsApi } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const EventSubmissionsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        const [ev, subList, projList] = await Promise.all([
          eventsApi.getEvent(eventId),
          submissionsApi.getSubmissions(eventId),
          projectsApi.getProjects(eventId),
        ]);
        setEvent(ev);
        setSubmissions(subList);

        const pMap: Record<string, Project> = {};
        projList.forEach((p: Project) => {
          pMap[p.id] = p;
        });
        setProjectsMap(pMap);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filtered = submissions.filter(s => {
    const proj = projectsMap[s.projectId];
    const q = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (proj && proj.title.toLowerCase().includes(q)) ||
      (proj && proj.teamName.toLowerCase().includes(q))
    );
  });

  const handleVerify = (subId: string) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === subId ? { ...s, status: 'accepted' as const } : s))
    );
    showToast('Submission verified', `Submission ${subId} marked as accepted.`, 'success');
  };

  const handleExportCSV = () => {
    const headers = ['Submission ID', 'Project ID', 'Project Title', 'Team Name', 'Submitted At', 'Version', 'Status'];
    const rows = filtered.map(s => {
      const proj = projectsMap[s.projectId];
      return [
        s.id,
        s.projectId,
        `"${(proj?.title || 'Unknown').replace(/"/g, '""')}"`,
        `"${(proj?.teamName || 'Unknown').replace(/"/g, '""')}"`,
        s.submittedAt,
        s.version,
        s.status,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event?.id || 'event'}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Exported submissions as CSV', 'success');
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
                <span className="text-slate-900 font-medium">Submissions</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Event Submissions {event ? `— ${event.title}` : ''}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit submitted payloads, timestamp locks, and verify compliance before judging commences.
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
            <Link to={`/organizer/events/${eventId}/teams`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Teams
            </Link>
            <Link to={`/organizer/events/${eventId}/projects`} className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Projects
            </Link>
            <Link to={`/organizer/events/${eventId}/submissions`} className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">
              Submissions ({submissions.length})
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

        {/* Search bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="w-80">
            <Input
              placeholder="Search by submission ID, project, or team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            Showing {filtered.length} of {submissions.length} submissions
          </span>
        </div>

        {/* Submissions Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No submissions found"
                description="Submissions will appear here as teams freeze and submit their projects."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Submission ID</th>
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(s => {
                    const proj = projectsMap[s.projectId];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-900">
                          {s.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {proj ? (
                            <Link to={`/projects/${proj.id}`} className="hover:underline">
                              {proj.title}
                            </Link>
                          ) : (
                            <span className="font-mono text-slate-500">{s.projectId}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {proj?.teamName || s.teamId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {s.submittedAt}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                          v{s.version}.0
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            s.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {s.status === 'accepted' ? 'Verified' : 'Pending Audit'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {s.status !== 'accepted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(s.id)}
                              className="text-[11px]"
                            >
                              Verify & Accept
                            </Button>
                          )}
                          {proj && (
                            <Link to={`/projects/${proj.id}`}>
                              <Button variant="ghost" size="sm" className="text-[11px]">
                                Inspect Project →
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
