import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { JudgeConflict, JudgeConflictReason, Event } from '../../types';
import { conflictsApi } from '../../services/api/conflicts.api';
import { eventsApi } from '../../api/events';
import { judgesApi } from '../../services/api/judges.api';
import { projectsApi } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const JudgeConflictManagementPage: React.FC = () => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = paramEventId || 'evt_nexus_2026';

  const [event, setEvent] = useState<Event | null>(null);
  const [conflicts, setConflicts] = useState<JudgeConflict[]>([]);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Declare modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judgeId, setJudgeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [reason, setReason] = useState<JudgeConflictReason>('DECLARED');
  const [notes, setNotes] = useState('');
  const [judgesList, setJudgesList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [ev, confs, jdgs, prjs] = await Promise.all([
          eventsApi.getEvent(eventId),
          conflictsApi.getConflicts(eventId),
          judgesApi.getJudges(eventId),
          projectsApi.getProjects(eventId),
        ]);
        setEvent(ev);
        setConflicts(confs);
        setJudgesList(jdgs);
        setProjectsList(prjs);
        if (jdgs.length > 0) setJudgeId(jdgs[0].id);
        if (prjs.length > 0) setProjectId(prjs[0].id);
      } catch (err) {
        console.error('Failed to load conflicts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleResolveConflict = async (id: string) => {
    try {
      const updated = await conflictsApi.resolveConflict(id);
      setConflicts(prev => prev.map(c => c.id === id ? updated : c));
      showToast('Conflict Resolved', `Conflict marked as resolved in backend registry.`, 'success');
    } catch {
      showToast('Error', 'Failed to resolve conflict', 'error');
    }
  };

  const handleDeclareConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    const selJudge = judgesList.find(j => j.id === judgeId);
    const selProj = projectsList.find(p => p.id === projectId);
    if (!selJudge || !selProj) return;

    setIsSubmitting(true);
    try {
      const created = await conflictsApi.declareConflict({
        eventId,
        judgeId,
        judgeName: selJudge.name,
        judgeEmail: selJudge.email,
        projectId,
        projectTitle: selProj.title,
        reason,
        notes,
      });

      setConflicts(prev => [created, ...prev]);
      showToast('Conflict Registered', `Conflict recorded for ${selJudge.name}.`, 'info');
      setIsModalOpen(false);
      setNotes('');
    } catch {
      showToast('Error', 'Failed to declare conflict', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = conflicts.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.judgeName.toLowerCase().includes(q) ||
      c.projectTitle.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q));

    const matchesReason = reasonFilter === 'all' || c.reason === reasonFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesReason && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const reasonLabels: Record<JudgeConflictReason, { label: string; badge: string }> = {
    OWN_TEAM: { label: 'Own Team Member', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    OWN_PROJECT: { label: 'Own Project Contributor', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    PROHIBITED_RELATIONSHIP: { label: 'Prohibited Relationship', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    DECLARED: { label: 'Voluntarily Declared', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
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
              <span className="text-slate-900 font-medium">Conflict Registry</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Judge Conflicts & Exclusions</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly enforced impartiality matrix. The optimization engine excludes conflicted pairs automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              Declare Conflict +
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input
            placeholder="Search by judge, project, or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Conflict Reasons', value: 'all' },
              { label: 'Own Team', value: 'OWN_TEAM' },
              { label: 'Own Project', value: 'OWN_PROJECT' },
              { label: 'Prohibited Relationship', value: 'PROHIBITED_RELATIONSHIP' },
              { label: 'Voluntarily Declared', value: 'DECLARED' },
            ]}
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active Exclusions', value: 'ACTIVE' },
              { label: 'Resolved Exclusions', value: 'RESOLVED' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No conflicts found"
                description="No active or resolved judge conflict records match your query."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Judge</th>
                    <th className="py-3 px-4">Conflicted Project</th>
                    <th className="py-3 px-4">Conflict Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Declared At</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => {
                    const rInfo = reasonLabels[c.reason] || { label: c.reason, badge: 'bg-slate-100 text-slate-700' };
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>{c.judgeName}</div>
                          <div className="text-[11px] font-normal text-slate-500">{c.judgeEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link to={`/projects/${c.projectId}`} className="font-semibold text-slate-900 hover:underline">
                            {c.projectTitle}
                          </Link>
                          {c.teamName && (
                            <div className="text-[11px] text-slate-500">Team: {c.teamName}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${rInfo.badge}`}>
                            {rInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            c.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {c.declaredAt.split('T')[0]}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px] leading-snug">
                          {c.notes || 'No specific notes recorded.'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {c.status === 'ACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveConflict(c.id)}
                              className="text-[11px]"
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">Resolved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Declare Conflict Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Declare Judge Conflict of Interest"
        >
          <form onSubmit={handleDeclareConflict} className="space-y-4">
            <p className="text-xs text-slate-500">
              Declaring a conflict will strictly prevent the backend assignment engine from matching this judge to the selected project.
            </p>

            <Select
              label="Select Judge"
              options={judgesList.map(j => ({ label: `${j.name} (${j.organization || j.email})`, value: j.id }))}
              value={judgeId}
              onChange={e => setJudgeId(e.target.value)}
              required
            />

            <Select
              label="Select Conflicted Project"
              options={projectsList.map(p => ({ label: `${p.title} — Team ${p.teamName}`, value: p.id }))}
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              required
            />

            <Select
              label="Conflict Classification"
              options={[
                { label: 'Own Team Member', value: 'OWN_TEAM' },
                { label: 'Own Project Contributor', value: 'OWN_PROJECT' },
                { label: 'Prohibited Relationship / Advisory Holding', value: 'PROHIBITED_RELATIONSHIP' },
                { label: 'Voluntarily Declared Prior Acquaintance', value: 'DECLARED' },
              ]}
              value={reason}
              onChange={e => setReason(e.target.value as JudgeConflictReason)}
              required
            />

            <Textarea
              label="Audit Documentation & Justification"
              placeholder="State the factual basis of the conflict for historical audit compliance..."
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Record Conflict
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
