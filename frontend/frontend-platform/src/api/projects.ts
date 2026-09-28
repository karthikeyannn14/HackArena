import { Project, ProjectStatus } from '../types';
import { db } from './storage';

export interface ProjectFilterOptions {
  eventId?: string;
  query?: string;
  trackId?: string;
  technology?: string;
  status?: ProjectStatus | 'all';
  sortBy?: 'recent' | 'title' | 'status';
}

export const projectsApi = {
  async getProjects(filters?: ProjectFilterOptions | string): Promise<Project[]> {
    await new Promise(r => setTimeout(r, 200));
    let projects = db.getProjects();

    const normalizedFilters: ProjectFilterOptions | undefined = 
      typeof filters === 'string' ? { eventId: filters } : filters;

    if (normalizedFilters?.eventId) {
      projects = projects.filter(p => p.eventId === normalizedFilters.eventId);
    }

    if (normalizedFilters?.query) {
      const q = normalizedFilters.query.toLowerCase();
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some(tech => tech.toLowerCase().includes(q)) ||
        p.teamName.toLowerCase().includes(q)
      );
    }

    if (normalizedFilters?.trackId && normalizedFilters.trackId !== 'all') {
      projects = projects.filter(p => p.trackId === normalizedFilters.trackId);
    }

    if (normalizedFilters?.technology && normalizedFilters.technology !== 'all') {
      projects = projects.filter(p => p.technologies.some(t => t.toLowerCase() === normalizedFilters.technology?.toLowerCase()));
    }

    if (normalizedFilters?.status && normalizedFilters.status !== 'all') {
      projects = projects.filter(p => p.status === normalizedFilters.status);
    }

    if (normalizedFilters?.sortBy === 'title') {
      projects.sort((a, b) => a.title.localeCompare(b.title));
    } else if (normalizedFilters?.sortBy === 'recent') {
      projects.sort((a, b) => (b.submissionDate || '').localeCompare(a.submissionDate || ''));
    }

    return projects;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await new Promise(r => setTimeout(r, 200));
    const projects = db.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Project ${id} not found`);

    const updated = { ...projects[index], ...updates };
    projects[index] = updated;
    db.setProjects(projects);
    return updated;
  },

  async getProject(id: string): Promise<Project | null> {
    await new Promise(r => setTimeout(r, 150));
    const projects = db.getProjects();
    return projects.find(p => p.id === id) || null;
  },

  async getProjectByTeam(teamId: string): Promise<Project | null> {
    await new Promise(r => setTimeout(r, 150));
    const projects = db.getProjects();
    return projects.find(p => p.teamId === teamId) || null;
  },

  async saveProjectDraft(projectData: Partial<Project> & { id?: string; eventId: string; teamId: string }): Promise<Project> {
    await new Promise(r => setTimeout(r, 300));
    const projects = db.getProjects();
    const id = projectData.id || `prj_${Date.now()}`;
    const existingIndex = projects.findIndex(p => p.id === id);

    const baseEvent = db.getEvents().find(e => e.id === projectData.eventId);
    const baseTeam = db.getTeams().find(t => t.id === projectData.teamId);

    const project: Project = {
      id,
      eventId: projectData.eventId,
      eventTitle: baseEvent?.title || projectData.eventTitle || 'Nexus AI Hackathon',
      teamId: projectData.teamId,
      teamName: baseTeam?.name || projectData.teamName || 'Team Alpha',
      title: projectData.title || 'Untitled Project',
      tagline: projectData.tagline || '',
      description: projectData.description || '',
      problem: projectData.problem || '',
      solution: projectData.solution || '',
      features: projectData.features || [],
      technologies: projectData.technologies || [],
      trackId: projectData.trackId || (baseEvent?.tracks[0]?.id || 'trk_gen'),
      trackName: projectData.trackName || (baseEvent?.tracks.find(t => t.id === projectData.trackId)?.name || 'General Track'),
      demoUrl: projectData.demoUrl || '',
      repoUrl: projectData.repoUrl || '',
      mediaUrls: projectData.mediaUrls || [],
      videoUrl: projectData.videoUrl,
      status: existingIndex >= 0 ? projects[existingIndex].status : 'draft',
      submissionDate: existingIndex >= 0 ? projects[existingIndex].submissionDate : undefined,
      submissionId: existingIndex >= 0 ? projects[existingIndex].submissionId : undefined,
      teamMembers: projectData.teamMembers || (baseTeam ? baseTeam.members.map(m => ({ id: m.id, name: m.name, role: m.role })) : []),
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.unshift(project);
    }

    db.setProjects(projects);
    return project;
  },

  async deleteProject(id: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 200));
    const projects = db.getProjects().filter(p => p.id !== id);
    db.setProjects(projects);
    return true;
  }
};
