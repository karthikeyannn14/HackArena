import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Assignment, Project } from '../../types';
import { eventsApi } from '../../api/events';
import { judgingApi } from '../../api/judging';
import { projectsApi } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const JudgeEventSubmissionsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        const [ev, allAssignments, allProjects] = await Promise.all([
          eventsApi.getEvent(eventId),
          judgingApi.getAssignments(eventId),
          projectsApi.getProjects(eventId),
        ]);
        setEvent(ev);
        setAssignments(allAssignments);

        const pMap: Record<string, Project> = {};
        allProjects.forEach(p => {
          pMap[p.id] = p;
        });
        setProjectsMap(pMap);
      } catch (err) {
        console.error('Failed to load submissions for judge:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const progressPercent = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link to="/judge" className="hover:text-slate-900">Judge Dashboard</Link>
                <span>/</span>
                <Link to="/judge/events" className="hover:text-slate-900">Competitions</Link>
                <span>/</span>
                <span className="text-slate-900 font-medium font-mono text-[11px]">{eventId}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Assigned Submissions {event ? `— ${event.title}` : ''}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Evaluate assigned entries against the official scoring rubric.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                Evaluation Progress
              </span>
              <span className="font-mono font-bold text-slate-900 text-lg tabular-nums">
                {completedCount} / {assignments.length} ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No assigned submissions yet"
                description="Organizers have not yet distributed submissions for this competition."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Project & Team</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => {
                    const proj = projectsMap[a.projectId];
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block text-sm">
                            {a.projectTitle}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Team: {a.teamName}
                          </span>
                          {proj?.tagline && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{proj.tagline}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {a.trackName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            a.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : a.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              a.status === 'completed'
                                ? 'bg-emerald-500'
                                : a.status === 'in_progress'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                            }`} />
                            {a.status === 'completed' ? 'Completed' : a.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link to={`/judge/submissions/${a.projectId}`}>
                            <Button
                              variant={a.status === 'completed' ? 'outline' : 'primary'}
                              size="sm"
                              className="text-xs"
                            >
                              {a.status === 'completed' ? 'Review Score' : 'Open Workspace →'}
                            </Button>
                          </Link>
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
