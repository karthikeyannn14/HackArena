import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teamsApi } from '../../api/teams';
import { projectsApi } from '../../api/projects';
import { eventsApi } from '../../api/events';
import { Team, Project, Event } from '../../types';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';

export const ParticipantDashboard: React.FC = () => {
  const { user, notifications } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const evts = await eventsApi.getEvents();
        const activeEvent = evts[0] || null;
        setEvent(activeEvent);

        if (user) {
          const myTeam = await teamsApi.getMyTeam(activeEvent?.id, user.id);
          setTeam(myTeam);

          if (myTeam) {
            const myProject = await projectsApi.getProjectByTeam(myTeam.id);
            setProject(myProject);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Participant Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {firstName}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Track your team roster, project submission status, and event deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/project">
            <Button variant="primary" size="sm">
              {project ? 'Edit Project' : 'Create Project'}
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="sm">
              Explore Events
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards (Tabular figures, single elevation) */}
      <div className="my-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Active Hackathons</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">01</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">{event?.title || 'Nexus AI'}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">My Team</span>
          <p className="text-xl font-bold text-slate-900 truncate">
            {team ? team.name : 'No Team Yet'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
            {team ? `${team.members.length} Active Members` : 'Create or join a team'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Project Status</span>
          <div className="mt-1">
            {project ? (
              <StatusBadge status={project.status} />
            ) : (
              <span className="text-xs text-slate-400">Not Created</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            {project?.title || 'Draft not started'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Submission Status</span>
          <p className="text-xl font-bold font-mono text-slate-900">
            {project?.status === 'submitted' ? 'Locked' : 'In Progress'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
            {project?.submissionId || 'Pending final review'}
          </p>
        </div>
      </div>

      {/* Main Grid: Current Hackathon & Project status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Hackathon Banner */}
          {event && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Competition
                </span>
                <StatusBadge status={event.status} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {event.tagline}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Submission Freeze</span>
                  <span className="font-semibold text-slate-900 font-mono">Oct 14, 23:59 UTC</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Judging Deliberation</span>
                  <span className="font-semibold text-slate-900 font-mono">Oct 15 – 16</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Bounty Pool</span>
                  <span className="font-semibold text-slate-900 font-mono">{event.prizeTotal}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <Link to={`/events/${event.id}`}>
                  <Button variant="ghost" size="sm">View Rules & Tracks →</Button>
                </Link>
                <Link to={`/events/${event.id}/projects`}>
                  <Button variant="outline" size="sm">Browse Competitors</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Project Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Project Workspace
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {project ? project.title : 'No Project Initialized'}
                </h3>
              </div>
              {project && <StatusBadge status={project.status} />}
            </div>

            {project ? (
              <div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {project.tagline}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Assigned Track</span>
                    <span className="font-medium text-slate-800">{project.trackName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Confirmation Token</span>
                    <span className="font-mono text-slate-800">{project.submissionId || 'Unsubmitted'}</span>
                  </div>
                  {project.demoUrl && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Live Demonstration</span>
                      <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">
                        {project.demoUrl}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <Link to="/dashboard/project">
                    <Button variant="primary" size="sm">
                      Continue Project Builder
                    </Button>
                  </Link>
                  <Link to="/dashboard/submissions">
                    <Button variant="outline" size="sm">
                      Review Submission Status
                    </Button>
                  </Link>
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      Public View
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-500 mb-4">
                  You have not created a project submission for this event yet.
                </p>
                <Link to="/dashboard/project">
                  <Button variant="primary" size="sm">
                    Start Project Submission
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Team Roster & Notifications */}
        <div className="space-y-6">
          {/* Team Quick Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Team Roster
              </h3>
              <Link to="/dashboard/team" className="text-xs text-slate-600 hover:text-slate-900">
                Manage →
              </Link>
            </div>

            {team ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-800">{team.name}</p>
                <div className="divide-y divide-slate-100">
                  {team.members.map(member => (
                    <div key={member.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-900 block">{member.name}</span>
                        <span className="text-[11px] text-slate-400 capitalize">{member.role}</span>
                      </div>
                      {member.role === 'leader' && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Leader
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link to="/dashboard/team">
                    <Button variant="outline" size="sm" className="w-full">
                      Invite Teammates
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-3">No team created yet.</p>
                <Link to="/dashboard/team">
                  <Button variant="outline" size="sm">Create Team</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Activity / Notifications */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              System Notifications
            </h3>
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 3).map(notif => (
                <div key={notif.id} className="py-2.5 text-left">
                  <p className="text-xs font-medium text-slate-900">{notif.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{notif.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
