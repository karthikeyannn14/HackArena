import { Assignment, Rubric, Evaluation, Judge } from '../types';
import { db } from './storage';

export const judgingApi = {
  async getRubric(eventId: string): Promise<Rubric> {
    await new Promise(r => setTimeout(r, 100));
    const rubrics = db.getRubrics();
    if (rubrics[eventId]) {
      return rubrics[eventId];
    }
    // Fallback standard rubric
    return (
      Object.values(rubrics)[0] || {
        id: `rbc_${eventId}`,
        eventId,
        criteria: [
          { id: 'crit_1', name: 'Technical Execution', description: 'Architectural soundness and code reliability', weight: 25, maxScore: 10 },
          { id: 'crit_2', name: 'Innovation', description: 'Novelty and creative problem-solving', weight: 25, maxScore: 10 },
          { id: 'crit_3', name: 'Utility & Practicality', description: 'Measurable real-world impact', weight: 25, maxScore: 10 },
          { id: 'crit_4', name: 'Presentation & Docs', description: 'Quality of demo and documentation', weight: 25, maxScore: 10 },
        ],
      }
    );
  },

  async getJudges(eventId?: string): Promise<Judge[]> {
    await new Promise(r => setTimeout(r, 150));
    return db.getJudges();
  },

  async inviteJudge(judgeData: { name: string; email: string; organization: string }): Promise<Judge> {
    await new Promise(r => setTimeout(r, 200));
    const judges = db.getJudges();
    const newJudge: Judge = {
      id: `usr_judge_${Date.now()}`,
      name: judgeData.name,
      email: judgeData.email,
      organization: judgeData.organization,
      assignedProjectIds: [],
      completedCount: 0,
      pendingCount: 0,
      status: 'invited',
    };
    db.setJudges([...judges, newJudge]);
    return newJudge;
  },

  async removeJudge(judgeId: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 200));
    const judges = db.getJudges().filter(j => j.id !== judgeId);
    db.setJudges(judges);
    return true;
  },

  async getAssignments(eventId?: string, judgeId?: string): Promise<Assignment[]> {
    await new Promise(r => setTimeout(r, 150));
    let assignments = db.getAssignments();
    if (eventId) {
      assignments = assignments.filter(a => a.eventId === eventId);
    }
    if (judgeId) {
      assignments = assignments.filter(a => a.judgeId === judgeId);
    }
    return assignments;
  },

  async getEvaluation(assignmentId: string): Promise<Evaluation | null> {
    await new Promise(r => setTimeout(r, 150));
    const evals = db.getEvaluations();
    return evals.find(e => e.assignmentId === assignmentId) || null;
  },

  async getEvaluationForProject(projectId: string, judgeId: string): Promise<Evaluation | null> {
    await new Promise(r => setTimeout(r, 150));
    const evals = db.getEvaluations();
    return evals.find(e => e.projectId === projectId && e.judgeId === judgeId) || null;
  },

  async saveEvaluation(evaluation: Evaluation): Promise<Evaluation> {
    await new Promise(r => setTimeout(r, 200));
    const evals = db.getEvaluations();
    const idx = evals.findIndex(e => e.id === evaluation.id || (e.assignmentId === evaluation.assignmentId && e.judgeId === evaluation.judgeId));

    evaluation.updatedAt = new Date().toISOString();

    if (idx >= 0) {
      evals[idx] = evaluation;
    } else {
      evals.push(evaluation);
    }

    db.setEvaluations(evals);

    // Update assignment status
    const assignments = db.getAssignments();
    const asg = assignments.find(a => a.id === evaluation.assignmentId || (a.projectId === evaluation.projectId && a.judgeId === evaluation.judgeId));
    if (asg) {
      asg.status = evaluation.isSubmitted ? 'completed' : 'in_progress';
      db.setAssignments(assignments);
    }

    return evaluation;
  }
};
