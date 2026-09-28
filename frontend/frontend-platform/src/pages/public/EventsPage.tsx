import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event, EventStatus } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'participants'>('date_desc');

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const data = await eventsApi.getEvents({
          query: searchQuery,
          status: statusFilter as EventStatus | 'all',
          sortBy,
        });
        setEvents(data);
      } finally {
        setIsLoading(false);
      }
    }
    const timer = setTimeout(fetchEvents, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Global Competitions
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Explore Hackathons
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Browse upcoming, live, and historical hackathons. Register your team and build verified software solutions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-4 rounded-lg border border-slate-200">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search hackathons by keyword or track..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            label="Event Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'live', label: 'Live Competitions' },
              { value: 'registration_open', label: 'Registration Open' },
              { value: 'registration_closed', label: 'Registration Closed' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            label="Sort By"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            options={[
              { value: 'date_desc', label: 'Newest Date' },
              { value: 'date_asc', label: 'Earliest Date' },
              { value: 'participants', label: 'Most Participants' },
            ]}
          />
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No hackathons match your search"
          description="Try adjusting your status filter or keyword to see more competitions."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card key={event.id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs text-slate-500 font-mono tabular-nums">{event.startDate} — {event.endDate}</span>
                  <StatusBadge status={event.status} />
                </div>

                <CardTitle className="text-lg leading-snug">
                  <Link to={`/events/${event.id}`} className="hover:text-slate-700 transition-colors">
                    {event.title}
                  </Link>
                </CardTitle>

                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Organized by {event.organizerName}
                </p>

                <CardDescription className="line-clamp-3 mt-3 leading-relaxed">
                  {event.tagline || event.description}
                </CardDescription>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tracks ({event.tracks.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {event.tracks.map(t => (
                      <span key={t.id} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-mono tabular-nums">
                    <strong className="text-slate-800">{event.participantCount}</strong> registered
                  </span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {event.prizeTotal} Pool
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/events/${event.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      View Event
                    </Button>
                  </Link>
                  <Link to={`/events/${event.id}/projects`}>
                    <Button variant="outline" size="sm">
                      Projects
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
