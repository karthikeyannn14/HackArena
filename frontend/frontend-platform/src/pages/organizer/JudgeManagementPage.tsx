import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgingApi } from '../../api/judging';
import { eventsApi } from '../../api/events';
import { Judge, Event } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

export const JudgeManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (eventId) {
          const ev = await eventsApi.getEvent(eventId);
          setEvent(ev);
        }
        const jdgs = await judgingApi.getJudges(eventId);
        setJudges(jdgs);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsInviting(true);
    try {
      const created = await judgingApi.inviteJudge({ name, email, organization });
      setJudges([...judges, created]);
      showToast('Judge Invited', `Invitation sent to ${email}`, 'success');
      setName('');
      setEmail('');
      setOrganization('');
      setInviteModalOpen(false);
    } catch (err: any) {
      showToast('Invite error', err?.message || 'Failed to send invite', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    if (confirm('Are you sure you want to remove this judge from the council?')) {
      await judgingApi.removeJudge(judgeId);
      setJudges(judges.filter(j => j.id !== judgeId));
      showToast('Judge Removed', 'Updated judge roster successfully.', 'info');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/organizer" className="hover:text-slate-900 transition-colors">Organizer</Link>
            <span>/</span>
            <Link to="/organizer/events" className="hover:text-slate-900 transition-colors">Events</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Judges</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Judge Council Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Onboard expert evaluators, manage reviewer workloads, and monitor evaluation progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)}>
            + Invite Judge
          </Button>
          <Link to={`/organizer/events/${eventId || 'evt_nexus_2026'}/assignments`}>
            <Button variant="outline" size="sm">
              View Assignments
            </Button>
          </Link>
        </div>
      </div>

      {/* Judges Table */}
      <div className="my-8 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Judge Profile</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Assigned</th>
                  <th className="px-5 py-3 text-center">Completed</th>
                  <th className="px-5 py-3 text-center">Pending</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {judges.map(judge => (
                  <tr key={judge.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{judge.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{judge.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {judge.organization || 'Independent Fellow'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={judge.status} />
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono tabular-nums text-slate-900 font-semibold">
                      {judge.assignedProjectIds?.length || 0}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono tabular-nums text-emerald-700 font-semibold">
                      {judge.completedCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono tabular-nums text-amber-700 font-semibold">
                      {judge.pendingCount}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <Link to={`/organizer/events/${eventId || 'evt_nexus_2026'}/assignments?judgeId=${judge.id}`}>
                        <Button variant="ghost" size="sm">
                          Assignments →
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleRemoveJudge(judge.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Judge Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Expert Judge"
        description="Invite a verified domain specialist or staff engineer to score hackathon submissions."
      >
        <form onSubmit={handleInviteJudge} className="space-y-4">
          <Input
            label="Judge Full Name"
            placeholder="Dr. Marcus Vance"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="marcus.vance@techvault.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Affiliated Organization / Institution"
            placeholder="Vance Autonomous Ventures"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isInviting}>
              Send Judge Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
