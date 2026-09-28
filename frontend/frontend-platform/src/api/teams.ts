import { Team, TeamMember, Invitation } from '../types';
import { db } from './storage';

export const teamsApi = {
  async getTeams(eventId?: string): Promise<Team[]> {
    await new Promise(r => setTimeout(r, 150));
    const teams = db.getTeams();
    if (eventId) {
      return teams.filter(t => t.eventId === eventId);
    }
    return teams;
  },

  async getTeam(id: string): Promise<Team | null> {
    await new Promise(r => setTimeout(r, 150));
    const teams = db.getTeams();
    return teams.find(t => t.id === id) || null;
  },

  async getMyTeam(eventId?: string, userId?: string): Promise<Team | null> {
    await new Promise(r => setTimeout(r, 150));
    const teams = db.getTeams();
    const currentUserId = userId || (db.getUsers().find(u => u.role === 'participant')?.id || 'usr_participant_1');
    return teams.find(t => 
      (!eventId || t.eventId === eventId) &&
      (t.leaderId === currentUserId || t.members.some(m => m.id === currentUserId))
    ) || null;
  },

  async createTeam(teamData: { eventId: string; name: string; description: string; leader: TeamMember }): Promise<Team> {
    await new Promise(r => setTimeout(r, 250));
    const teams = db.getTeams();
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      eventId: teamData.eventId,
      name: teamData.name,
      description: teamData.description,
      leaderId: teamData.leader.id,
      leaderName: teamData.leader.name,
      members: [teamData.leader],
      invitations: [],
      createdAt: new Date().toISOString(),
    };
    db.setTeams([newTeam, ...teams]);
    return newTeam;
  },

  async inviteMember(teamId: string, email: string): Promise<Invitation> {
    await new Promise(r => setTimeout(r, 200));
    const teams = db.getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const invitation: Invitation = {
      id: `inv_${Date.now()}`,
      email,
      role: 'member',
      status: 'pending',
      invitedAt: new Date().toISOString(),
    };

    team.invitations = [...(team.invitations || []), invitation];
    db.setTeams(teams);
    return invitation;
  },

  async removeMember(teamId: string, memberId: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 200));
    const teams = db.getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    team.members = team.members.filter(m => m.id !== memberId);
    db.setTeams(teams);
    return true;
  },

  async leaveTeam(teamId: string, userId: string): Promise<boolean> {
    return this.removeMember(teamId, userId);
  }
};
