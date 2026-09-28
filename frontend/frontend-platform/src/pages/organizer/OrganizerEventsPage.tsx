import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonTable } from '../../components/ui/Skeleton';

export const OrganizerEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      try {
        const data = await eventsApi.getEvents();
        setEvents(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/organizer" className="hover:text-slate-900 transition-colors">Organizer</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Events</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Event Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure parameters, competition tracks, schedules, and prize allocations across all hackathons.
          </p>
        </div>

        <Link to="/organizer/events/new">
          <Button variant="primary" size="sm">
            + Create New Hackathon
          </Button>
        </Link>
      </div>

      {/* Events Table */}
      <div className="my-8 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Hackathon</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Timeline</th>
                  <th className="px-5 py-3">Tracks</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3">Bounty Pool</th>
                  <th className="px-5 py-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-xs">
                      <div>{ev.title}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{ev.organizerName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-mono tabular-nums">
                      {ev.startDate} – {ev.endDate}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-mono tabular-nums">
                      {ev.tracks.length} tracks
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-mono tabular-nums">
                      {ev.participantCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900">
                      {ev.prizeTotal}
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link to={`/organizer/events/${ev.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${ev.id}/judges`}>
                        <Button variant="ghost" size="sm">
                          Judges
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${ev.id}/assignments`}>
                        <Button variant="ghost" size="sm">
                          Assignments
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${ev.id}/results`}>
                        <Button variant="ghost" size="sm">
                          Results
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
  );
};
