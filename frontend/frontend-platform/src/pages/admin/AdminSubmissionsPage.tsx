import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Submission, Project, Event } from '../../types';
import { submissionsApi } from '../../api/submissions';
import { projectsApi } from '../../api/projects';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [eventsMap, setEventsMap] = useState<Record<string, Event>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [allSubs, allPrjs, allEvts] = await Promise.all([
          submissionsApi.getSubmissions(),
          projectsApi.getProjects(),
          eventsApi.getEvents(),
        ]);
        setSubmissions(allSubs);

        const pMap: Record<string, Project> = {};
        allPrjs.forEach((p: Project) => { pMap[p.id] = p; });
        setProjectsMap(pMap);

        const eMap: Record<string, Event> = {};
        allEvts.forEach((e: Event) => { eMap[e.id] = e; });
        setEventsMap(eMap);
      } catch (err) {
        console.error('Failed to load admin submissions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase();
    const proj = projectsMap[s.projectId];
    const evt = eventsMap[s.eventId];

    return (
      s.id.toLowerCase().includes(q) ||
      (proj && proj.title.toLowerCase().includes(q)) ||
      (proj && proj.teamName.toLowerCase().includes(q)) ||
      (evt && evt.title.toLowerCase().includes(q))
    );
  });

  const handleToggleVerify = (subId: string) => {
    setSubmissions(prev =>
      prev.map(s => {
        if (s.id === subId) {
          const newStatus = s.status === 'accepted' ? 'submitted' : 'accepted';
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
    showToast('Submission status updated', `Submission ${subId} audit state updated.`, 'info');
  };

  const handleExportCSV = () => {
    const headers = ['Submission ID', 'Project ID', 'Project Title', 'Event', 'Team', 'Submitted At', 'Version', 'Status'];
    const rows = filtered.map(s => {
      const proj = projectsMap[s.projectId];
      const evt = eventsMap[s.eventId];
      return [
        s.id,
        s.projectId,
        `"${(proj?.title || 'Unknown').replace(/"/g, '""')}"`,
        `"${(evt?.title || s.eventId).replace(/"/g, '""')}"`,
        `"${(proj?.teamName || s.teamId).replace(/"/g, '""')}"`,
        s.submittedAt,
        s.version,
        s.status,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'devpulse_all_submissions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Exported platform submissions log as CSV', 'success');
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
              <span className="text-slate-900 font-medium">Submissions Verification</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Global Submissions Log</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive cryptographic freeze audits, payload timestamps, and verification states across all events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              Export Submissions CSV
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="w-80">
            <Input
              placeholder="Search by submission ID, project, or event..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            Total records: {filtered.length}
          </span>
        </div>

        {/* Submissions Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No submissions match query"
                description="No submissions found matching search criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Submission ID</th>
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Hackathon Event</th>
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
                    const evt = eventsMap[s.eventId];

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
                        <td className="py-3.5 px-4 text-slate-700">
                          {evt?.title || s.eventId}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVerify(s.id)}
                            className="text-[11px]"
                          >
                            {s.status === 'accepted' ? 'Revoke Verification' : 'Verify & Approve'}
                          </Button>
                          {proj && (
                            <Link to={`/projects/${proj.id}`}>
                              <Button variant="ghost" size="sm" className="text-[11px]">
                                Inspect â†’
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


