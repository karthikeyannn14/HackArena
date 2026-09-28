import { Project, Submission } from '../types';
import { db } from './storage';

export const submissionsApi = {
  async getSubmissions(eventId?: string): Promise<Submission[]> {
    await new Promise(r => setTimeout(r, 150));
    const projects = db.getProjects();
    const submittedProjects = projects.filter(p => p.status !== 'draft');
    let list: Submission[] = submittedProjects.map(p => ({
      id: p.submissionId || `SUB-2026-${p.id.replace(/\D/g, '').padEnd(4, '0') || '8819'}`,
      projectId: p.id,
      eventId: p.eventId,
      teamId: p.teamId,
      submittedAt: p.submissionDate || '2026-10-14T22:30:00Z',
      status: 'accepted',
      version: 1,
    }));

    if (eventId) {
      list = list.filter(s => s.eventId === eventId);
    }
    return list;
  },

  async submitProject(projectId: string): Promise<{ project: Project; submission: Submission }> {
    await new Promise(r => setTimeout(r, 350));
    const projects = db.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const submissionId = project.submissionId || `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const submissionDate = new Date().toISOString();

    project.status = 'submitted';
    project.submissionDate = submissionDate;
    project.submissionId = submissionId;

    db.setProjects(projects);

    const submission: Submission = {
      id: submissionId,
      projectId: project.id,
      eventId: project.eventId,
      teamId: project.teamId,
      submittedAt: submissionDate,
      status: 'submitted',
      version: 1,
    };

    // Add a notification
    const notifs = db.getNotifications();
    db.setNotifications([
      {
        id: `notif_${Date.now()}`,
        title: 'Project Submitted',
        message: `Project "${project.title}" has been locked and submitted with confirmation ID ${submissionId}.`,
        type: 'success',
        timestamp: 'Just now',
        read: false,
      },
      ...notifs
    ]);

    return { project, submission };
  },

  async getSubmissionStatus(projectId: string): Promise<{ isSubmitted: boolean; submission?: Submission; project?: Project }> {
    const project = db.getProjects().find(p => p.id === projectId);
    if (!project || project.status === 'draft') {
      return { isSubmitted: false, project };
    }
    return {
      isSubmitted: true,
      project,
      submission: {
        id: project.submissionId || 'SUB-2026-8819',
        projectId: project.id,
        eventId: project.eventId,
        teamId: project.teamId,
        submittedAt: project.submissionDate || new Date().toISOString(),
        status: 'submitted',
        version: 1,
      },
    };
  }
};
