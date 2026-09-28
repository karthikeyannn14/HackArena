import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Event, Assignment } from '../../types';
import { eventsApi } from '../../api/events';
import { judgingApi } from '../../api/judging';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';

export const JudgeEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allEvents, allAssignments] = await Promise.all([
          eventsApi.getEvents(),
          judgingApi.getAssignments(),
        ]);
        setEvents(allEvents);
        setAssignments(allAssignments);
      } catch (err) {
        console.error('Failed to load judge events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/judge" className="hover:text-slate-900">Judge Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Competitions</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Assigned Hackathons & Competitions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse hackathons where you have active or upcoming judging duties.
          </p>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => {
            const eventAssignments = assignments.filter(a => a.eventId === event.id);
            const completed = eventAssignments.filter(a => a.status === 'completed').length;
            const total = eventAssignments.length;

            return (
              <div key={event.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusBadge status={event.status} />
                    <span className="font-mono text-xs text-slate-500">
                      Prize: {event.prizeTotal}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {event.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {event.tagline}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Submissions</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                        {completed} / {total || 2} completed
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Judging Window</span>
                      <span className="font-mono text-slate-700 text-xs">
                        {event.judgingStartDate.split('T')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    Organizer: {event.organizerName}
                  </span>
                  <Link to={`/judge/events/${event.id}/submissions`}>
                    <Button variant="primary" size="sm">
                      Review Submissions →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
