import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Project, Event, ProjectStatus } from '../../types';
import { projectsApi } from '../../api/projects';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [allProjects, allEvents] = await Promise.all([
          projectsApi.getProjects(),
          eventsApi.getEvents(),
        ]);
        setProjects(allProjects);
        setEvents(allEvents);
      } catch (err) {
        console.error('Failed to load admin projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateStatus = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const updated = await projectsApi.updateProject(projectId, { status: newStatus });
      setProjects(prev => prev.map(p => (p.id === projectId ? updated : p)));
      showToast('Project Status Updated', `Project status is now ${newStatus}`, 'success');
    } catch {
      showToast('Error', 'Failed to update project status', 'error');
    }
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.teamName.toLowerCase().includes(q) ||
      p.technologies.some(t => t.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || p.eventId === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
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
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin" className="hover:text-slate-900">Admin</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Projects & Artifacts</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Project Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review intellectual property, code repositories, verified builds, and moderation flags across all events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
              Total Projects: {projects.length}
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input
            placeholder="Search projects, technologies, or teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Lifecycle Statuses', value: 'all' },
              { label: 'Draft', value: 'draft' },
              { label: 'Submitted', value: 'submitted' },
              { label: 'Under Review', value: 'under_review' },
              { label: 'Evaluated', value: 'evaluated' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Hackathons', value: 'all' },
              ...events.map(e => ({ label: e.title, value: e.id })),
            ]}
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
          />
        </div>

        {/* Projects Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No projects match criteria"
                description="Try clearing filters or search queries."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Project & Tagline</th>
                    <th className="py-3 px-4">Hackathon Event</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tech Stack</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link to={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:underline">
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">{p.tagline}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {p.eventTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.teamName}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={p.status}
                          onChange={e => handleUpdateStatus(p.id, e.target.value as ProjectStatus)}
                          className="text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1"
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="evaluated">Evaluated</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.technologies.slice(0, 3).map(tech => (
                            <span key={tech} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
                              {tech}
                            </span>
                          ))}
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
                        <Link to={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm" className="text-[11px]">
                            Inspect →
                          </Button>
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
