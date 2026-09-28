import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AssignmentRun, Assignment, Judge, Event } from '../../types';
import { assignmentsApi } from '../../services/api/assignments.api';
import { judgesApi } from '../../services/api/judges.api';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../context/ToastContext';

export const AssignmentDashboardPage: React.FC = () => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = paramEventId || 'evt_nexus_2026';

  const [event, setEvent] = useState<Event | null>(null);
  const [runs, setRuns] = useState<AssignmentRun[]>([]);
  const [activeRun, setActiveRun] = useState<AssignmentRun | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningOptimization, setIsRunningOptimization] = useState(false);

  // Lineage modal state
  const [selectedAssignmentForLineage, setSelectedAssignmentForLineage] = useState<Assignment | null>(null);

  // Replace assignment modal state
  const [replacingAssignment, setReplacingAssignment] = useState<Assignment | null>(null);
  const [newJudgeId, setNewJudgeId] = useState('');
  const [replaceReason, setReplaceReason] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [ev, allRuns, allAssignments, allJudges] = await Promise.all([
          eventsApi.getEvent(eventId),
          assignmentsApi.getAssignmentRuns(eventId),
          assignmentsApi.getAssignments(eventId),
          judgesApi.getJudges(eventId),
        ]);
        setEvent(ev);
        setRuns(allRuns);
        if (allRuns.length > 0) setActiveRun(allRuns[0]);
        setAssignments(allAssignments);
        setJudges(allJudges);
        if (allJudges.length > 0) setNewJudgeId(allJudges[0].id);
      } catch (err) {
        console.error('Failed to load assignment dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleTriggerRun = async () => {
    setIsRunningOptimization(true);
    try {
      const newRun = await assignmentsApi.triggerAssignmentRun(eventId, 3);
      setRuns(prev => [newRun, ...prev]);
      setActiveRun(newRun);
      showToast('Optimization Run Complete', `Backend computed assignments using ${newRun.algorithmVersion}`, 'success');
      const updatedAssignments = await assignmentsApi.getAssignments(eventId);
      setAssignments(updatedAssignments);
    } catch {
      showToast('Error', 'Failed to trigger optimization run', 'error');
    } finally {
      setIsRunningOptimization(false);
    }
  };

  const handleReplaceAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingAssignment) return;
    const targetJudge = judges.find(j => j.id === newJudgeId);
    if (!targetJudge) return;

    setIsReplacing(true);
    try {
      await assignmentsApi.replaceAssignment({
        assignmentId: replacingAssignment.id,
        newJudgeId,
        newJudgeName: targetJudge.name,
        newJudgeEmail: targetJudge.email,
        reason: replaceReason || 'Manual administrative reallocation',
      });

      const updatedAssignments = await assignmentsApi.getAssignments(eventId);
      setAssignments(updatedAssignments);
      showToast('Assignment Replaced', `Project reassigned to ${targetJudge.name}. Lineage logged.`, 'success');
      setReplacingAssignment(null);
      setReplaceReason('');
    } catch {
      showToast('Error', 'Failed to replace assignment', 'error');
    } finally {
      setIsReplacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const runBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'COMPLETED_WITH_EXCEPTIONS':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      case 'RUNNING':
        return 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse';
      case 'FAILED':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/organizer" className="hover:text-slate-900">Organizer</Link>
              <span>/</span>
              <Link to={`/organizer/events/${eventId}`} className="hover:text-slate-900 font-mono text-[11px]">{eventId}</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Assignment Engine</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assignment Run & Workload Engine</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative Min-Cost Flow distribution. View run state, unresolved exceptions, and full lineage history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerRun}
              isLoading={isRunningOptimization}
            >
              Trigger Optimization Run (K=3)
            </Button>
          </div>
        </div>

        {/* Active Run Banner */}
        {activeRun && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Active Assignment Run
                </span>
                <span className="text-base font-bold text-slate-900 font-mono">{activeRun.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono border ${runBadge(activeRun.status)}`}>
                  {activeRun.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Optimization Model</span>
                <span className="font-mono font-semibold text-slate-900">{activeRun.algorithmVersion}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Judge Requirement (K)</span>
                <span className="font-mono font-semibold text-slate-900">{activeRun.kValue} Judges / Project</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Execution Latency</span>
                <span className="font-mono font-semibold text-slate-900">{activeRun.executionTimeMs || 3200} ms</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Assignments</span>
                <span className="font-mono font-bold text-slate-900">{activeRun.totalAssignments} pairings</span>
              </div>
            </div>

            {/* Unresolved Projects Panel (Edge-Case Requirement) */}
            {activeRun.unresolvedProjects && activeRun.unresolvedProjects.length > 0 && (
              <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Unresolved Projects ({activeRun.unresolvedProjects.length}) — K-Requirement Shortfall
                  </h3>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  The backend optimizer could not satisfy the K=3 condition due to conflict exclusions or judge capacity.
                </p>
                <div className="space-y-2">
                  {activeRun.unresolvedProjects.map(up => (
                    <div key={up.projectId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded border border-amber-200 text-xs gap-2">
                      <div>
                        <span className="font-bold text-slate-900">{up.projectTitle}</span>
                        <span className="text-slate-500 ml-2">({up.teamName} · {up.trackName})</span>
                        <p className="text-[11px] text-rose-700 mt-0.5">{up.reason}</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                        Deficit: -{up.shortfall} Judge
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Judge Workload Distribution Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Judge Workload Distribution</h2>
              <p className="text-xs text-slate-500">Live capacity and evaluation throughput derived from backend state.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Judge</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Projects</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4">Pending</th>
                  <th className="py-3 px-4">Throughput</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {judges.map(j => {
                  const assignedCount = j.assignedProjectIds.length;
                  const pct = assignedCount > 0 ? Math.round((j.completedCount / assignedCount) * 100) : 0;
                  return (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {j.name}
                        <div className="text-[11px] font-normal text-slate-500">{j.organization}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
                          j.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : j.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        {assignedCount}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold tabular-nums">
                        {j.completedCount}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-700 font-semibold tabular-nums">
                        {j.pendingCount}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div className="bg-slate-900 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600 tabular-nums">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Assignments Matrix & Lineage Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active & Historical Assignments</h2>
              <p className="text-xs text-slate-500">Every assignment record is permanent. Replaced pairs show full audit lineage.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assigned Judge</th>
                  <th className="py-3 px-4">Evaluation State</th>
                  <th className="py-3 px-4">Assignment State</th>
                  <th className="py-3 px-4">Assigned At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map(a => (
                  <tr key={a.id} className={`hover:bg-slate-50/70 transition-colors ${a.assignmentState === 'SUPERSEDED' ? 'opacity-60 bg-slate-50/40' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{a.projectTitle}</div>
                      <div className="text-[11px] font-normal text-slate-500">Team: {a.teamName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <div>{a.judgeName}</div>
                      <div className="text-[11px] text-slate-500">{a.judgeEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {a.status}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
                        a.assignmentState === 'SUPERSEDED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {a.assignmentState || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {a.assignedAt.split('T')[0]}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {a.lineage && a.lineage.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAssignmentForLineage(a)}
                          className="text-[11px]"
                        >
                          View Lineage ({a.lineage.length})
                        </Button>
                      )}
                      {a.assignmentState !== 'SUPERSEDED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplacingAssignment(a)}
                          className="text-[11px]"
                        >
                          Reassign
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignment Lineage Drawer / Modal */}
        <Modal
          isOpen={!!selectedAssignmentForLineage}
          onClose={() => setSelectedAssignmentForLineage(null)}
          title={`Assignment Lineage Tree: ${selectedAssignmentForLineage?.projectTitle}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Immutable chain of custody for this evaluation pairing:
            </p>

            <div className="space-y-3 border-l-2 border-slate-300 pl-4 ml-2">
              {selectedAssignmentForLineage?.lineage?.map((step, idx) => (
                <div key={idx} className="relative text-xs space-y-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute -left-[21px] top-1" />
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{step.action}</span>
                    <span className="font-mono text-[10px] text-slate-400">{step.timestamp}</span>
                  </div>
                  <p className="text-slate-600">{step.reason}</p>
                  <p className="text-[11px] text-slate-400">Actor: {step.actor}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssignmentForLineage(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* Replace Assignment Modal */}
        <Modal
          isOpen={!!replacingAssignment}
          onClose={() => setReplacingAssignment(null)}
          title={`Reassign: ${replacingAssignment?.projectTitle}`}
        >
          <form onSubmit={handleReplaceAssignment} className="space-y-4">
            <p className="text-xs text-slate-500">
              This operation will mark assignment <span className="font-mono font-bold text-slate-800">{replacingAssignment?.id}</span> as SUPERSEDED and generate a new assignment record with linked audit lineage.
            </p>

            <Select
              label="Select Replacement Judge"
              options={judges.filter(j => j.status === 'ACTIVE' && j.id !== replacingAssignment?.judgeId).map(j => ({
                label: `${j.name} (${j.organization}) — ${j.assignedProjectIds.length} assigned`,
                value: j.id,
              }))}
              value={newJudgeId}
              onChange={e => setNewJudgeId(e.target.value)}
              required
            />

            <Textarea
              label="Reassignment Justification (Required for Audit Trail)"
              placeholder="State reason: e.g. schedule conflict, capacity rebalance, domain specialty match..."
              rows={3}
              value={replaceReason}
              onChange={e => setReplaceReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReplacingAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isReplacing}>
                Execute Reassignment
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
