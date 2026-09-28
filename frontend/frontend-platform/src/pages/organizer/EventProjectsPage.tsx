import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Project, ProjectStatus } from '../../types';
import { eventsApi } from '../../api/events';
import { projectsApi } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const EventProjectsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        const [ev, projList] = await Promise.all([
          eventsApi.getEvent(eventId),
          projectsApi.getProjects(eventId),
        ]);
        setEvent(ev);
        setProjects(projList);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tagline.toLowerCase().includes(search.toLowerCase()) ||
      p.teamName.toLowerCase().includes(search.toLowerCase()) ||
      p.technologies.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesTrack = trackFilter === 'all' || p.trackId === trackFilter;

    return matchesSearch && matchesStatus && matchesTrack;
  });

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
                <span className="text-slate-900 font-medium">Projects</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Event Projects {event ? `— ${event.title}` : ''}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted architecture, track alignments, code repositories, and demo endpoints.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to={`/events/${eventId}/projects`} target="_blank">
                <Button variant="outline" size="sm">Public Gallery ↗</Button>
              </Link>
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
            <Link to={`/organizer/events/${eventId}/projects`} className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">
              Projects ({projects.length})
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
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input
            placeholder="Search projects, tech, or teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Draft', value: 'draft' },
              { label: 'Submitted', value: 'submitted' },
              { label: 'Under Review', value: 'under_review' },
              { label: 'Evaluated', value: 'evaluated' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          />

          <Select
            options={[
              { label: 'All Challenge Tracks', value: 'all' },
              ...(event?.tracks.map(t => ({ label: t.name, value: t.id })) || []),
            ]}
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
          />
        </div>

        {/* Projects Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No projects found"
                description="No projects matched the search filters for this event."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Project Title & Tagline</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Technologies</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link to={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:underline">
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">{p.tagline}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.teamName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {p.trackName}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.technologies.slice(0, 3).map(tech => (
                            <span key={tech} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
                              {tech}
                            </span>
                          ))}
                          {p.technologies.length > 3 && (
                            <span className="text-[10px] font-mono text-slate-400">+{p.technologies.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                          >
                            Repo ↗
                          </a>
                        )}
                        <Link
                          to={`/projects/${p.id}`}
                          className="text-[11px] font-semibold text-slate-900 hover:underline"
                        >
                          View Details →
                        </Link>
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
