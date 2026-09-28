import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const p = await projectsApi.getProject(projectId);
        setProject(p);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested submission could not be retrieved.</p>
        <Link to="/events" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Competitions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/events" className="hover:text-slate-900 transition-colors">Events</Link>
        <span>/</span>
        <Link to={`/events/${project.eventId}`} className="hover:text-slate-900 transition-colors truncate max-w-xs">{project.eventTitle}</Link>
        <span>/</span>
        <Link to={`/events/${project.eventId}/projects`} className="hover:text-slate-900 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{project.title}</span>
      </div>

      {/* Main Project Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">{project.trackName}</span>
              <span aria-hidden="true">·</span>
              <StatusBadge status={project.status} />
              {project.submissionId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-400">ID: {project.submissionId}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {project.tagline}
            </p>
          </div>

          {/* External Links Actions */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm">
                  Launch Interactive Demo ↗
                </Button>
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Source Code Repository ↗
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Tech Stack Pills / List */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Engineered With
          </span>
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map(tech => (
              <span key={tech} className="font-mono text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Problem, Solution, Features */}
        <div className="lg:col-span-2 space-y-8">
          {/* Problem Statement */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              The Engineering Problem
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {project.problem || project.description}
            </p>
          </div>

          {/* Technical Solution */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Proposed Solution & Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {project.solution || project.description}
            </p>
          </div>

          {/* Key Features */}
          {project.features && project.features.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Core Capabilities & Benchmarks
              </h2>
              <ul className="space-y-2.5">
                {project.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Media / Architecture Diagrams */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Architecture & Telemetry
            </h2>
            <div className="rounded-md border border-slate-200 bg-slate-900 p-8 text-center text-slate-400">
              <div className="max-w-xs mx-auto space-y-2">
                <svg className="w-8 h-8 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-medium text-slate-300">Technical schematics & benchmarks</p>
                <p className="text-[11px] text-slate-500">Live test runs and trace diagrams attached to submission</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Team & Submission Metadata */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Participating Team
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{project.teamName}</h3>
            </div>

            <div className="pt-2 divide-y divide-slate-100">
              {project.teamMembers.map(m => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{m.name}</span>
                    <span className="text-slate-500 text-[11px]">{m.role}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Verified</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3 text-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Submission Metadata
            </span>
            <div className="divide-y divide-slate-100">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Event</span>
                <span className="font-medium text-slate-900 truncate max-w-[140px]">{project.eventTitle}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Track</span>
                <span className="font-medium text-slate-900 truncate max-w-[140px]">{project.trackName}</span>
              </div>
              {project.submissionDate && (
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Submitted</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {new Date(project.submissionDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
