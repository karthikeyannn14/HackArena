import { PrismaClient } from '@prisma/client';
import { 
  AssignmentSnapshot, 
  JudgeSnapshot, 
  ProjectSnapshot, 
  ConflictSnapshot 
} from './types';
import * as crypto from 'crypto';

export class AssignmentSnapshotBuilder {
  constructor(private prisma: PrismaClient) {}

  public async build(
    eventId: string, 
    kValue: number, 
    algorithmVersion: string, 
    seed?: string
  ): Promise<AssignmentSnapshot> {
    
    // Load projects for the event
    const projectsData = await this.prisma.project.findMany({
      where: { eventId },
      orderBy: { id: 'asc' } // Ensure deterministic base ordering
    });

    // We load only judges explicitly invited and ACTIVE for this specific event, 
    // ensuring they are also globally active.
    const eventJudges = await this.prisma.eventJudge.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
        judge: {
          isActive: true
        }
      },
      include: {
        judge: true
      },
      orderBy: {
        judgeId: 'asc' // Deterministic base ordering
      }
    });

    const judgesData = eventJudges.map(ej => ej.judge);

    const judgeIds = judgesData.map(j => j.id);
    const projectIds = projectsData.map(p => p.id);

    // Load explicit conflicts between these judges and projects
    const conflictsData = await this.prisma.judgeConflict.findMany({
      where: {
        judgeId: { in: judgeIds },
        projectId: { in: projectIds }
      },
      orderBy: [
        { judgeId: 'asc' },
        { projectId: 'asc' }
      ]
    });

    // Construct immutable snapshots
    const eligibleProjects: ProjectSnapshot[] = projectsData.map(p => ({
      projectId: p.id,
      teamId: p.teamId
    }));

    const eligibleJudges: JudgeSnapshot[] = judgesData.map(j => ({
      judgeId: j.id,
      teamId: j.teamId || undefined,
      // Mismatch identified: The Judge model lacks an ownProjectId directly, but a Judge 
      // might be mapped to a project via their Team.
      // Smallest correction: derive ownProjectId by finding the project that belongs to the judge's team.
      ownProjectId: projectsData.find(p => p.teamId === j.teamId)?.id
    }));

    const conflicts: ConflictSnapshot[] = conflictsData.map(c => ({
      judgeId: c.judgeId,
      projectId: c.projectId,
      reason: (c.reason as string) === 'DECLARED' ? 'DECLARED' : 'PROHIBITED_RELATIONSHIP'
    }));

    // Ensure strictly deterministic sorting before returning
    const deterministicSeed = seed || crypto.randomUUID(); // Fallback to random if no seed provided
    const assignmentRunId = crypto.randomUUID(); // Temporary ID until persisted

    return {
      assignmentRunId,
      algorithmVersion,
      deterministicSeed,
      kValue,
      eligibleJudges: [...eligibleJudges].sort((a, b) => a.judgeId.localeCompare(b.judgeId)),
      eligibleProjects: [...eligibleProjects].sort((a, b) => a.projectId.localeCompare(b.projectId)),
      conflicts: [...conflicts].sort((a, b) => {
        const cmp = a.judgeId.localeCompare(b.judgeId);
        if (cmp !== 0) return cmp;
        return a.projectId.localeCompare(b.projectId);
      }),
      judgingConfiguration: {
        eventId,
        generatedAt: new Date().toISOString()
      }
    };
  }
}
