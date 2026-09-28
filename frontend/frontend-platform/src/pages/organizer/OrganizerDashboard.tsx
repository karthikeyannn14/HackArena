import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { projectsApi } from '../../api/projects';
import { judgesApi } from '../../services/api/judges.api';
import { assignmentsApi } from '../../services/api/assignments.api';
import { normalizationApi } from '../../services/api/normalization.api';
import { Event, Project, Judge, Assignment, AssignmentRun } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';

export const OrganizerDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [runs, setRuns] = useState<AssignmentRun[]>([]);
  const [normalizationCount, setNormalizationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizerData() {
      setIsLoading(true);
      try {
        const [evts, prjs, jdgs, asgs, allRuns, normResults] = await Promise.all([
          eventsApi.getEvents(),
          projectsApi.getProjects(),
          judgesApi.getJudges(),
          assignmentsApi.getAssignments('evt_nexus_2026'),
          assignmentsApi.getAssignmentRuns('evt_nexus_2026'),
          normalizationApi.getNormalizationResults('evt_nexus_2026'),
        ]);
        setEvents(evts);
        setProjects(prjs);
        setJudges(jdgs);
        setAssignments(asgs);
        setRuns(allRuns);
        setNormalizationCount(normResults.length);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizerData();
  }, []);

  const totalParticipants = events.reduce((acc, e) => acc + e.participantCount, 0);
  const activeJudges = judges.filter(j => j.status === 'ACTIVE' || j.status === 'active').length;
  const suspendedJudges = judges.filter(j => j.status === 'SUSPENDED').length;
  const removedJudges = judges.filter(j => j.status === 'REMOVED').length;
  const completedEvals = assignments.filter(a => a.status === 'completed' || a.status === 'SUBMITTED').length;
  const completionRate = assignments.length > 0 ? Math.round((completedEvals / assignments.length) * 100) : 0;
  const latestRun = runs[0];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const primaryEventId = events[0]?.id || 'evt_nexus_2026';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administration & Judging Engine
            </span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Min-Cost Flow Optimization Ready
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organizer Headquarters
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Orchestrate hackathons, enforce judge conflict exclusions, execute K-assignment runs, and audit normalized rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/organizer/events/new">
            <Button variant="primary" size="sm">
              + Create Hackathon
            </Button>
          </Link>
          <Link to={`/organizer/events/${primaryEventId}/assignments`}>
            <Button variant="outline" size="sm">
              Assignment Engine →
            </Button>
          </Link>
        </div>
      </div>

      {/* Section 8 Required Metrics Grid: Total judges, active, suspended, removed, projects, assignment status, evaluation completion, normalization status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Total Judges</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {judges.length < 10 ? `0${judges.length}` : judges.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Registered council</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Active Judges</span>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {activeJudges < 10 ? `0${activeJudges}` : activeJudges}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Eligible for pairing</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Suspended</span>
          <p className="text-xl font-bold font-mono tabular-nums text-rose-700">
            {suspendedJudges < 10 ? `0${suspendedJudges}` : suspendedJudges}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Excluded from pool</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Removed</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-500">
            {removedJudges < 10 ? `0${removedJudges}` : removedJudges}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">De-boarded judges</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Total Projects</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {projects.length < 10 ? `0${projects.length}` : projects.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Verified payloads</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Run State</span>
          <span className="inline-block text-[11px] font-bold font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate max-w-full">
            {latestRun ? latestRun.status : 'COMPLETED'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">K=3 Min-Cost Flow</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Evaluation %</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {completionRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{completedEvals}/{assignments.length} scored</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] text-slate-500 block mb-0.5">Normalization</span>
          <span className="inline-block text-[11px] font-bold font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            NORMALIZED
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{normalizationCount} computed</p>
        </div>
      </div>

      {/* Judging Engine Control Grid: Section 8 & 9 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link to={`/organizer/conflicts`} className="group">
          <Card hoverable className="h-full">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Impartiality Matrix</span>
            <CardTitle className="text-sm mt-1 group-hover:text-blue-600 transition-colors">
              Judge Conflicts
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Enforce prohibitions for own team, own project, and declared relationships.
            </CardDescription>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-800 flex justify-between">
              <span>Inspect Conflicts</span>
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link to={`/organizer/assignments`} className="group">
          <Card hoverable className="h-full">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Min-Cost Flow</span>
            <CardTitle className="text-sm mt-1 group-hover:text-blue-600 transition-colors">
              Assignment Engine
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Trigger K-runs, audit unresolved projects panel, and view lineage history.
            </CardDescription>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-800 flex justify-between">
              <span>Assignment Runs</span>
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link to={`/organizer/rubrics`} className="group">
          <Card hoverable className="h-full">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Versioned Schema</span>
            <CardTitle className="text-sm mt-1 group-hover:text-blue-600 transition-colors">
              Rubric Builder
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Configure criteria weights, fork draft versions, and lock published editions.
            </CardDescription>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-800 flex justify-between">
              <span>Rubric Versions</span>
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link to={`/organizer/normalization`} className="group">
          <Card hoverable className="h-full">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Statistical Engine</span>
            <CardTitle className="text-sm mt-1 group-hover:text-blue-600 transition-colors">
              Normalization Dashboard
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Audit Z-scores, judge sample variance, and Bayesian project consensus.
            </CardDescription>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-800 flex justify-between">
              <span>View Z-Scores</span>
              <span>→</span>
            </div>
          </Card>
        </Link>

        <Link to={`/organizer/audit`} className="group">
          <Card hoverable className="h-full">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Immutable History</span>
            <CardTitle className="text-sm mt-1 group-hover:text-blue-600 transition-colors">
              Compliance Audit
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Review authoritative chronological logs, assignments replaced, and reopenings.
            </CardDescription>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-800 flex justify-between">
              <span>Audit Stream</span>
              <span>→</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Active Hackathons Management Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active & Upcoming Competitions
            </h2>
            <p className="text-xs text-slate-500">Live competitions linked to judging engine orchestrations.</p>
          </div>
          <Link to="/organizer/events/new">
            <Button variant="ghost" size="sm">+ New Hackathon</Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Hackathon Title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Timeline</th>
                <th className="px-5 py-3">Participants</th>
                <th className="px-5 py-3">Bounty Pool</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    <Link to={`/organizer/events/${ev.id}`} className="hover:underline font-semibold">
                      {ev.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono tabular-nums">
                    {ev.startDate} – {ev.endDate}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-mono tabular-nums">
                    {ev.participantCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                    {ev.prizeTotal}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <Link to={`/organizer/events/${ev.id}`}>
                      <Button variant="outline" size="sm">
                        Command Center →
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
      </div>
    </div>
  );
};
