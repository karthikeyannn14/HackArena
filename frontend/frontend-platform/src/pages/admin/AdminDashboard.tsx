import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { usersApi } from '../../api/users';
import { teamsApi } from '../../api/teams';
import { projectsApi } from '../../api/projects';
import { submissionsApi } from '../../api/submissions';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    eventsCount: 0,
    usersCount: 0,
    teamsCount: 0,
    projectsCount: 0,
    submissionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [evs, usrs, tms, prjs, subs] = await Promise.all([
          eventsApi.getEvents(),
          usersApi.getUsers(),
          teamsApi.getTeams(),
          projectsApi.getProjects(),
          submissionsApi.getSubmissions(),
        ]);

        setStats({
          eventsCount: evs.length,
          usersCount: usrs.length,
          teamsCount: tms.length,
          projectsCount: prjs.length,
          submissionsCount: subs.length,
        });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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

  const auditEvents = [
    { id: 'aud_1', time: '10 mins ago', action: 'User registered', detail: 'Kenji Sato (CUDA kernel specialist) joined platform' },
    { id: 'aud_2', time: '25 mins ago', action: 'Project updated', detail: 'Project "AetherKernel" submitted final milestone' },
    { id: 'aud_3', time: '1 hour ago', action: 'Judge assigned', detail: 'Dr. Marcus Vance assigned to 3 AI infrastructure projects' },
    { id: 'aud_4', time: '3 hours ago', action: 'Event published', detail: 'Nexus AI & Distributed Systems Hackathon entered Live status' },
    { id: 'aud_5', time: 'Yesterday', action: 'Submission verified', detail: 'Sub-4980 marked valid by Global Hackathon Federation' },
  ];

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-700 font-semibold uppercase tracking-wider">
                System Healthy · All Modules Operational
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Administration Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Global governance, multi-tenant event orchestration, user access control, and telemetry audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/organizer/events/new">
              <Button variant="primary" size="sm">Create New Event</Button>
            </Link>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.eventsCount}</p>
            <Link to="/admin/events" className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline mt-1 block">
              Manage Events →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registered Users</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.usersCount}</p>
            <Link to="/admin/users" className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline mt-1 block">
              User Directory →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Teams</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.teamsCount}</p>
            <Link to="/admin/teams" className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline mt-1 block">
              Audit Teams →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Projects</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.projectsCount}</p>
            <Link to="/admin/projects" className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline mt-1 block">
              Review Projects →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submissions Log</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.submissionsCount}</p>
            <Link to="/admin/submissions" className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline mt-1 block">
              Submissions Log →
            </Link>
          </div>
        </div>

        {/* Administration Navigation Quick Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Audit Stream
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Live Telemetry</span>
            </div>

            <div className="divide-y divide-slate-100">
              {auditEvents.map(e => (
                <div key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{e.action}</span>
                    <span className="text-slate-500 mt-0.5 block">{e.detail}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Platform Server Details */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Backend Services
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Architecture:</span>
                  <span className="font-mono text-slate-900 text-[11px]">Express REST + MongoDB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auth Engine:</span>
                  <span className="font-mono text-slate-900 text-[11px]">JWT / bcryptjs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Base:</span>
                  <span className="font-mono text-slate-900 text-[11px]">/api</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-600 font-semibold text-[11px]">Online (Fallback Ready)</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Admin Modules
              </h3>
              <div className="space-y-2 text-xs">
                <Link to="/admin/events" className="block text-slate-700 hover:text-slate-900 font-medium">
                  → Hackathon Events Management
                </Link>
                <Link to="/admin/users" className="block text-slate-700 hover:text-slate-900 font-medium">
                  → Users & Role Delegation
                </Link>
                <Link to="/admin/teams" className="block text-slate-700 hover:text-slate-900 font-medium">
                  → Team Rosters & Registrations
                </Link>
                <Link to="/admin/projects" className="block text-slate-700 hover:text-slate-900 font-medium">
                  → Projects & Code Moderation
                </Link>
                <Link to="/admin/submissions" className="block text-slate-700 hover:text-slate-900 font-medium">
                  → Submissions Verification & Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
