import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, EventStatus } from '../../types';
import { eventsApi } from '../../api/events';
import { teamsApi } from '../../api/teams';
import { projectsApi } from '../../api/projects';
import { submissionsApi } from '../../api/submissions';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const EventOverviewPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState({
    teamsCount: 0,
    projectsCount: 0,
    submissionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        const ev = await eventsApi.getEvent(eventId);
        setEvent(ev);

        const [teams, projects, submissions] = await Promise.all([
          teamsApi.getTeams(eventId),
          projectsApi.getProjects(eventId),
          submissionsApi.getSubmissions(eventId),
        ]);

        setStats({
          teamsCount: teams.length,
          projectsCount: projects.length,
          submissionsCount: submissions.length,
        });
      } catch (err) {
        console.error('Failed to load event overview:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!event) return;
    try {
      const updated = await eventsApi.updateEvent(event.id, { status: newStatus });
      setEvent(updated);
      showToast('Event status updated', `Status changed to ${newStatus.replace('_', ' ')}`, 'success');
    } catch {
      showToast('Error', 'Failed to update event status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested hackathon could not be loaded.</p>
        <Link to="/organizer/events" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumbs & Status Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link to="/organizer" className="hover:text-slate-900">Organizer</Link>
                <span>/</span>
                <Link to="/organizer/events" className="hover:text-slate-900">Events</Link>
                <span>/</span>
                <span className="text-slate-900 font-mono text-[11px]">{event.id}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{event.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{event.tagline}</p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              <div className="relative inline-block">
                <select
                  value={event.status}
                  onChange={e => handleStatusChange(e.target.value as EventStatus)}
                  className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="upcoming">Status: Upcoming</option>
                  <option value="registration_open">Status: Registration Open</option>
                  <option value="registration_closed">Status: Registration Closed</option>
                  <option value="live">Status: Live</option>
                  <option value="completed">Status: Completed</option>
                </select>
              </div>
              <Link to={`/events/${event.id}`} target="_blank">
                <Button variant="outline" size="sm">Public Page ↗</Button>
              </Link>
              <Link to={`/organizer/events/${event.id}/edit`}>
                <Button variant="primary" size="sm">Edit Event</Button>
              </Link>
            </div>
          </div>

          {/* Navigation Bar for Event Sub-modules */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-4 mt-6 text-xs font-medium">
            <Link
              to={`/organizer/events/${event.id}`}
              className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold shrink-0"
            >
              Overview
            </Link>
            <Link
              to={`/organizer/events/${event.id}/teams`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Teams ({stats.teamsCount})
            </Link>
            <Link
              to={`/organizer/events/${event.id}/projects`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Projects ({stats.projectsCount})
            </Link>
            <Link
              to={`/organizer/events/${event.id}/submissions`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Submissions ({stats.submissionsCount})
            </Link>
            <Link
              to={`/organizer/events/${event.id}/judges`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Judges
            </Link>
            <Link
              to={`/organizer/events/${event.id}/conflicts`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Conflicts
            </Link>
            <Link
              to={`/organizer/events/${event.id}/assignments`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Assignments
            </Link>
            <Link
              to={`/organizer/events/${event.id}/rubrics`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Rubric
            </Link>
            <Link
              to={`/organizer/events/${event.id}/normalization`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Normalization
            </Link>
            <Link
              to={`/organizer/events/${event.id}/audit`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Audit
            </Link>
            <Link
              to={`/organizer/events/${event.id}/results`}
              className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            >
              Results
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Participants</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{event.participantCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Across global registrations</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teams Formed</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.teamsCount}</p>
            <Link to={`/organizer/events/${event.id}/teams`} className="text-[11px] text-slate-600 hover:underline mt-1 block">
              Manage teams →
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects In Progress</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.projectsCount}</p>
            <Link to={`/organizer/events/${event.id}/projects`} className="text-[11px] text-slate-600 hover:underline mt-1 block">
              Review projects →
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Submissions</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.submissionsCount}</p>
            <Link to={`/organizer/events/${event.id}/submissions`} className="text-[11px] text-slate-600 hover:underline mt-1 block">
              Inspect submissions →
            </Link>
          </div>
        </div>

        {/* Two-Column Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Competition Tracks & Rules */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-4">
                Challenge Tracks & Prize Pool ({event.prizeTotal})
              </h2>
              <div className="divide-y divide-slate-100">
                {event.tracks.map(track => (
                  <div key={track.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">{track.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{track.description}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0">
                      {track.prizePool}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-3">
                Event Schedule & Milestones
              </h2>
              <div className="space-y-3">
                {event.schedule.map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-3 rounded-md bg-slate-50 border border-slate-100">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                      {item.time}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Deadlines & Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Key Event Deadlines
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Registration Deadline:</span>
                  <span className="font-mono font-semibold text-slate-900">{event.registrationDeadline}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submission Deadline:</span>
                  <span className="font-mono font-semibold text-rose-700">{event.submissionDeadline}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Judging Period:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {event.judgingStartDate.split('T')[0]} to {event.judgingEndDate.split('T')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Organizer Quick Actions
              </h3>
              <div className="space-y-2">
                <Link to={`/organizer/events/${event.id}/teams`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    👥 View Registered Teams ({stats.teamsCount})
                  </Button>
                </Link>
                <Link to={`/organizer/events/${event.id}/projects`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    📁 Review Submitted Projects ({stats.projectsCount})
                  </Button>
                </Link>
                <Link to={`/organizer/events/${event.id}/submissions`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    ✓ Verify Final Submissions ({stats.submissionsCount})
                  </Button>
                </Link>
                <Link to={`/organizer/events/${event.id}/judges`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    ⚖️ Configure Evaluation Judges
                  </Button>
                </Link>
                <Link to={`/organizer/events/${event.id}/results`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    🏆 Calculate & Publish Results
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
