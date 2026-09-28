import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { eventsApi } from '../../api/events';
import { Project, Event } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export const ProjectsGalleryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (eventId) {
          const ev = await eventsApi.getEvent(eventId);
          setEvent(ev);
        }
        const data = await projectsApi.getProjects({
          eventId: eventId,
          query,
          trackId: selectedTrack,
          technology: selectedTech,
          sortBy,
        });
        setProjects(data);
      } finally {
        setIsLoading(false);
      }
    }
    const timer = setTimeout(loadData, 150);
    return () => clearTimeout(timer);
  }, [eventId, query, selectedTrack, selectedTech, sortBy]);

  // Extract unique technologies for filter dropdown
  const allTechs = Array.from(new Set(projects.flatMap(p => p.technologies))).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          {event ? (
            <>
              <Link to="/events" className="hover:text-slate-900 transition-colors">Events</Link>
              <span>/</span>
              <Link to={`/events/${event.id}`} className="hover:text-slate-900 transition-colors truncate max-w-xs">{event.title}</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Submissions</span>
            </>
          ) : (
            <span className="text-slate-800 font-medium">Global Project Gallery</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Project Submissions Gallery
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Discover verified engineering prototypes, benchmarks, and architectures submitted by participating teams.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-4 rounded-lg border border-slate-200">
        <div className="sm:col-span-5">
          <Input
            placeholder="Search projects, problems, or architectures..."
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
            label="Challenge Track"
            value={selectedTrack}
            onChange={e => setSelectedTrack(e.target.value)}
            options={[
              { value: 'all', label: 'All Tracks' },
              ...(event ? event.tracks.map(t => ({ value: t.id, label: t.name })) : [
                { value: 'trk_ai_infra', label: 'AI Infrastructure' },
                { value: 'trk_resilient_systems', label: 'Resilient Distributed Systems' },
                { value: 'trk_dev_tooling', label: 'Developer Tooling' },
                { value: 'trk_community', label: 'Open Ecosystem' },
              ])
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            label="Technology"
            value={selectedTech}
            onChange={e => setSelectedTech(e.target.value)}
            options={[
              { value: 'all', label: 'All Tech' },
              ...allTechs.map(t => ({ value: t, label: t }))
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            label="Sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            options={[
              { value: 'recent', label: 'Newest' },
              { value: 'title', label: 'Alphabetical' },
            ]}
          />
        </div>
      </div>

      {/* Projects Grid: 3-4 Desktop, 2 Tablet, 1 Mobile */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="There are no project submissions matching the active search parameters."
          actionLabel="Reset Search"
          onAction={() => {
            setQuery('');
            setSelectedTrack('all');
            setSelectedTech('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map(project => (
            <Card key={project.id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                  <span className="truncate font-medium text-slate-600">{project.trackName}</span>
                  <StatusBadge status={project.status} />
                </div>

                <CardTitle className="text-base line-clamp-1">
                  <Link to={`/projects/${project.id}`} className="hover:text-slate-700 transition-colors">
                    {project.title}
                  </Link>
                </CardTitle>

                <p className="text-xs text-slate-500 mt-0.5">
                  by <strong className="font-semibold text-slate-800">{project.teamName}</strong>
                </p>

                <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                  {project.tagline}
                </CardDescription>

                <div className="mt-4 flex flex-wrap gap-1">
                  {project.technologies.slice(0, 3).map(tech => (
                    <span key={tech} className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {project.submissionId || 'DRAFT'}
                </span>
                <Link to={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm">
                    View Project →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
