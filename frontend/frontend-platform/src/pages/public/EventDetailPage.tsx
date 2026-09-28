import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { projectsApi } from '../../api/projects';
import { Event, Project } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const data = await eventsApi.getEvent(eventId);
        setEvent(data);
        if (data) {
          const prjs = await projectsApi.getProjects({ eventId: data.id });
          setProjects(prjs);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The event does not exist or has been archived.</p>
        <Link to="/events" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Browse Events</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tracks', label: `Tracks (${event.tracks.length})` },
    { id: 'rules', label: 'Rules & Guidelines' },
    { id: 'schedule', label: `Schedule (${event.schedule.length})` },
    { id: 'prizes', label: `Prizes (${event.prizes.length})` },
    { id: 'faqs', label: 'FAQ' },
    { id: 'projects', label: `Submissions (${projects.length})` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Link to="/events" className="hover:text-slate-900 transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{event.title}</span>
      </div>

      {/* Event Header Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={event.status} />
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                Organized by <strong className="text-slate-700">{event.organizerName}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {event.tagline || event.description}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[200px]">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => {
                if (user && role === 'participant') {
                  navigate('/dashboard/project');
                } else if (!user) {
                  navigate('/register');
                } else {
                  navigate('/dashboard');
                }
              }}
            >
              {user ? 'Manage Project' : 'Register for Event'}
            </Button>
            <Link to={`/events/${event.id}/projects`} className="w-full">
              <Button variant="outline" size="md" className="w-full">
                View Submitted Projects ({projects.length})
              </Button>
            </Link>
          </div>
        </div>

        {/* Deadlines Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Registration Deadline</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{event.registrationDeadline}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Submission Deadline</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">Oct 14, 23:59 UTC</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Judging Period</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">Oct 15 – 16, 2026</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Prize Bounty</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{event.prizeTotal}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="mt-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content Panels */}
      <div className="mt-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  About the Hackathon
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Competition Tracks
                </h3>
                <div className="space-y-4">
                  {event.tracks.map(t => (
                    <div key={t.id} className="p-4 rounded-md border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-semibold text-slate-900">{t.name}</h4>
                        <span className="text-xs font-mono font-bold text-slate-800">{t.prizePool}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar quick info */}
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Event Details
                </h3>
                <div className="space-y-3 text-xs divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Participants</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">{event.participantCount}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Projects In Review</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">{projects.length}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Location</span>
                    <span className="font-medium text-slate-900">Global / Virtual</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Team Size</span>
                    <span className="font-medium text-slate-900">1 – 4 Engineers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracks */}
        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.tracks.map((t, index) => (
              <Card key={t.id} className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-400">Track 0{index + 1}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{t.prizePool} Bounty</span>
                </div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <CardDescription className="text-xs leading-relaxed mt-2">
                  {t.description}
                </CardDescription>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <Link to={`/events/${event.id}/projects?track=${t.id}`}>
                    <Button variant="ghost" size="sm">Explore Track Projects →</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Rules */}
        {activeTab === 'rules' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Official Competition Rules
            </h3>
            <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="pl-1">
                  {rule}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
              Milestones & Timeline
            </h3>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
              {event.schedule.map(item => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono tabular-nums font-semibold text-slate-800">{item.date}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{item.time}</span>
                    <span>·</span>
                    <span className="capitalize text-slate-400">{item.type}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prizes */}
        {activeTab === 'prizes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.prizes.map(prz => (
              <Card key={prz.id} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prize Category</span>
                  <span className="text-base font-bold font-mono text-slate-900">{prz.amount}</span>
                </div>
                <CardTitle className="text-base">{prz.title}</CardTitle>
                <CardDescription className="text-xs mt-2 leading-relaxed">{prz.description}</CardDescription>
              </Card>
            ))}
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faqs' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 max-w-3xl divide-y divide-slate-100">
            {event.faqs.map(faq => (
              <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                <h4 className="text-sm font-semibold text-slate-900">{faq.question}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects Submissions */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Submissions for this Hackathon</h3>
              <Link to={`/events/${event.id}/projects`}>
                <Button variant="outline" size="sm">Open Gallery View</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map(p => (
                <Card key={p.id} hoverable className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>{p.trackName}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <CardTitle className="text-base line-clamp-1">{p.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
                      {p.tagline}
                    </CardDescription>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{p.teamName}</span>
                    <Link to={`/projects/${p.id}`}>
                      <Button variant="ghost" size="sm">Inspect →</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
