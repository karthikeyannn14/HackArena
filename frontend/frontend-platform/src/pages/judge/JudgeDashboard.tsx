import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { judgingApi } from '../../api/judging';
import { Assignment } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SkeletonTable } from '../../components/ui/Skeleton';

export const JudgeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      setIsLoading(true);
      try {
        const judgeId = user?.id || 'usr_judge_1';
        const data = await judgingApi.getAssignments('evt_nexus_2026', judgeId);
        setAssignments(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssignments();
  }, [user]);

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const remainingCount = totalAssigned - completedCount;
  const progressPercent = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Judging Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Judge Evaluation Console
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review assigned hackathon projects, inspect architecture, and score against the evaluation rubric.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/events/evt_nexus_2026">
            <Button variant="outline" size="sm">
              Event Details
            </Button>
          </Link>
          <Link to="/events/evt_nexus_2026/projects">
            <Button variant="ghost" size="sm">
              All Submissions
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="my-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Assigned Projects</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {totalAssigned < 10 ? `0${totalAssigned}` : totalAssigned}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total assigned queue</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Completed</span>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {completedCount < 10 ? `0${completedCount}` : completedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Evaluations submitted</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">In Progress / Draft</span>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-700">
            {inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Scores drafted</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500 block mb-1">Remaining to Grade</span>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {remainingCount < 10 ? `0${remainingCount}` : remainingCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pending review</p>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 mb-8">
        <ProgressBar
          value={progressPercent}
          label="Judging Deliberation Completion"
          showPercent={true}
        />
      </div>

      {/* Assignments Table */}
      <div id="assignments" className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Assigned Projects Queue
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {assignments.length} Projects Assigned
          </span>
        </div>

        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Project Title</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Evaluation Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map(asg => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {asg.projectTitle}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{asg.teamName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{asg.trackName}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={asg.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/judge/projects/${asg.projectId}?assignmentId=${asg.id}`}>
                        <Button
                          variant={asg.status === 'completed' ? 'outline' : 'primary'}
                          size="sm"
                        >
                          {asg.status === 'completed' ? 'Review Evaluation' : 'Evaluate Project →'}
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
