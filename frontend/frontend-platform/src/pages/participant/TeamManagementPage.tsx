import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teamsApi } from '../../api/teams';
import { eventsApi } from '../../api/events';
import { Team, TeamMember } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Create team modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      if (!user) return;
      setIsLoading(true);
      try {
        const evts = await eventsApi.getEvents();
        const activeEvt = evts[0];
        const t = await teamsApi.getMyTeam(activeEvt?.id, user.id);
        setTeam(t);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeam();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteEmail) return;
    setIsInviting(true);
    try {
      const inv = await teamsApi.inviteMember(team.id, inviteEmail);
      setTeam({
        ...team,
        invitations: [...(team.invitations || []), inv],
      });
      showToast('Invitation sent', `Invited ${inviteEmail} to ${team.name}`, 'success');
      setInviteEmail('');
      setInviteModalOpen(false);
    } catch (err: any) {
      showToast('Invite failed', err?.message || 'Unable to send invitation', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !user) return;
    setIsCreating(true);
    try {
      const evts = await eventsApi.getEvents();
      const activeEvt = evts[0];
      const leader: TeamMember = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'leader',
        skills: ['Architecture', 'Engineering'],
      };
      const created = await teamsApi.createTeam({
        eventId: activeEvt?.id || 'evt_nexus_2026',
        name: newTeamName,
        description: newTeamDesc,
        leader,
      });
      setTeam(created);
      showToast('Team Created', `Team "${created.name}" is now active.`, 'success');
      setCreateModalOpen(false);
    } catch (err: any) {
      showToast('Creation failed', err?.message || 'Unable to create team', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;
    if (confirm('Are you sure you want to remove this team member?')) {
      await teamsApi.removeMember(team.id, memberId);
      setTeam({
        ...team,
        members: team.members.filter(m => m.id !== memberId),
      });
      showToast('Member removed', 'Updated team roster successfully.', 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Participant Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Assemble your collaborators, assign technical specialties, and track invitations.
          </p>
        </div>

        <div>
          {team ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              disabled={team.members.length >= 4}
            >
              + Invite Teammate
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
              + Create Team
            </Button>
          )}
        </div>
      </div>

      {team ? (
        <div className="mt-8 space-y-8">
          {/* Team Info Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Team Roster
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{team.name}</h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
                  {team.description || 'No team bio provided.'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400 block">Roster Capacity</span>
                <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                  {team.members.length} / 4 Members
                </span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Confirmed Members ({team.members.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {team.members.map(member => (
                <div key={member.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        member.role === 'leader' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                    {member.skills && member.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.skills.map(s => (
                          <span key={s} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {member.id !== user?.id && team.leaderId === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Pending Invitations ({team.invitations?.length || 0})
            </h3>
            {!team.invitations || team.invitations.length === 0 ? (
              <p className="text-xs text-slate-500">No invitations are currently pending.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {team.invitations.map(inv => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-900 block">{inv.email}</span>
                      <span className="text-slate-400 text-[11px]">
                        Dispatched {new Date(inv.invitedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Pending acceptance
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State: Prompt to create a team */
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto">
          <h2 className="text-base font-bold text-slate-900">You are not in a team yet</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            Create a squad to collaborate on software projects or coordinate with existing teams.
          </p>
          <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
            Create New Team
          </Button>
        </div>
      )}

      {/* Invite Teammate Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Teammate"
        description="Send an email invitation to a fellow engineer. They will be added to your roster upon accepting."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Engineer's Email Address"
            type="email"
            placeholder="colleague@domain.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Team Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Team"
        description="Establish a new team for the active hackathon."
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input
            label="Team Name"
            placeholder="e.g. Distributed Core Labs"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            required
          />
          <Textarea
            label="Team Mission / Description"
            placeholder="Summarize your team's background, research focus, or project target..."
            value={newTeamDesc}
            onChange={e => setNewTeamDesc(e.target.value)}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isCreating}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
