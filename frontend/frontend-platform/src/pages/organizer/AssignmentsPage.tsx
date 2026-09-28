import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { judgingApi } from '../../api/judging';
import { Assignment, Judge } from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonTable } from '../../components/ui/Skeleton';

export const AssignmentsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const initialJudgeFilter = searchParams.get('judgeId') || 'all';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedJudge, setSelectedJudge] = useState(initialJudgeFilter);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const targetEventId = eventId || 'evt_nexus_2026';
        const [asgs, jdgs] = await Promise.all([
          judgingApi.getAssignments(targetEventId),
          judgingApi.getJudges(targetEventId),
        ]);
        setAssignments(asgs);
        setJudges(jdgs);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filteredAssignments = assignments.filter(a => {
    if (selectedJudge !== 'all' && a.judgeId !== selectedJudge) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/organizer" className="hover:text-slate-900 transition-colors">Organizer</Link>
            <span>/</span>
            <Link to={`/organizer/events/${eventId || 'evt_nexus_2026'}/judges`} className="hover:text-slate-900 transition-colors">Judges</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Assignments</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Project & Judge Assignments
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Audit backend-balanced project allocations, reviewer queues, and evaluation statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/organizer/events/${eventId || 'evt_nexus_2026'}/results`}>
            <Button variant="outline" size="sm">
              Live Results Leaderboard →
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <Select
          label="Filter by Judge"
          value={selectedJudge}
          onChange={e => setSelectedJudge(e.target.value)}
          options={[
            { value: 'all', label: 'All Reviewers' },
            ...judges.map(j => ({ value: j.id, label: `${j.name} (${j.organization})` })),
          ]}
        />

        <Select
          label="Filter by Evaluation Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'completed', label: 'Completed Evaluations' },
            { value: 'in_progress', label: 'In Progress / Drafted' },
            { value: 'not_started', label: 'Not Started' },
          ]}
        />
      </div>

      {/* Assignments Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No assignments match the selected judge or evaluation status filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Assigned Judge</th>
                  <th className="px-5 py-3">Project Title</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Assigned Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map(asg => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{asg.judgeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{asg.judgeEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      <Link to={`/projects/${asg.projectId}`} className="hover:underline">
                        {asg.projectTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{asg.teamName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{asg.trackName}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={asg.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-400">
                      {new Date(asg.assignedAt).toLocaleDateString()}
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
