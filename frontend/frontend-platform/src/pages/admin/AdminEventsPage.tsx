import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Event, EventStatus } from '../../types';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const evs = await eventsApi.getEvents();
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: EventStatus) => {
    try {
      const updated = await eventsApi.updateEvent(id, { status: newStatus });
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
      showToast('Status Updated', `Event status set to ${newStatus}`, 'success');
    } catch {
      showToast('Error', 'Failed to update event status', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await eventsApi.deleteEvent(id);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'completed' as const } : e));
      showToast('Event Archived', `"${title}" has been archived.`, 'info');
    } catch {
      showToast('Error', 'Failed to delete event', 'error');
    }
  };

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(q) ||
      e.organizerName.toLowerCase().includes(q) ||
      e.tagline.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin" className="hover:text-slate-900">Admin</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Events Management</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Hackathons</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, configure lifecycle states, inspect participant counts, and moderate competitions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/organizer/events/new">
              <Button variant="primary" size="sm">Create New Event</Button>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search hackathons or organizers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[
                { label: 'All Lifecycle Statuses', value: 'all' },
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Registration Open', value: 'registration_open' },
                { label: 'Registration Closed', value: 'registration_closed' },
                { label: 'Live', value: 'live' },
                { label: 'Completed', value: 'completed' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No events match your query"
                description="Try clearing search filters or create a new event."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4">Organizer</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Metrics</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Link to={`/organizer/events/${e.id}`} className="hover:underline">
                          {e.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 max-w-sm mt-0.5">
                          {e.tagline}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {e.organizerName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {e.startDate} to {e.endDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={e.status}
                          onChange={evt => handleStatusChange(e.id, evt.target.value as EventStatus)}
                          className="text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="registration_open">Registration Open</option>
                          <option value="registration_closed">Registration Closed</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <div>{e.participantCount} users</div>
                        <div className="text-slate-400">{e.prizeTotal} pool</div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link to={`/organizer/events/${e.id}`}>
                          <Button variant="ghost" size="sm" className="text-[11px]">
                            Command Center →
                          </Button>
                        </Link>
                        <Link to={`/organizer/events/${e.id}/edit`}>
                          <Button variant="outline" size="sm" className="text-[11px]">
                            Edit
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
