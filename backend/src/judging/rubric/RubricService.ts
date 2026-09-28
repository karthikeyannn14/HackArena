import { PrismaClient } from '@prisma/client';
import { JsonField } from '../utils/JsonField';
import { AuditAction } from '../audit';

export class RubricService {
  constructor(private readonly prisma: PrismaClient) {}

  async createRubric(eventId: string, name: string, description: string | null, actorId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const rubric = await tx.rubric.create({
        data: {
          eventId,
          name,
          description
        }
      });

      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.RUBRIC_CREATED,
          entity: 'Rubric',
          entityId: rubric.id,
          metadata: JsonField.serialize({ eventId, name })
        }
      });

      return rubric.id;
    });
  }

  async createRubricVersion(rubricId: string, actorId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const rubric = await tx.rubric.findUnique({ where: { id: rubricId } });
      if (!rubric) throw new Error('Rubric not found');

      const versions = await tx.rubricVersion.findMany({
        where: { rubricId },
        orderBy: { version: 'desc' },
        take: 1
      });

      const nextVersionNumber = versions.length > 0 && versions[0] ? versions[0].version + 1 : 1;

      const newVersion = await tx.rubricVersion.create({
        data: {
          rubricId,
          version: nextVersionNumber,
          isPublished: false
        }
      });

      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.RUBRIC_VERSION_CREATED,
          entity: 'RubricVersion',
          entityId: newVersion.id,
          metadata: JsonField.serialize({ rubricId, version: nextVersionNumber })
        }
      });

      return newVersion.id;
    });
  }

  async addCriterion(
    rubricVersionId: string,
    data: { name: string; description?: string; weight: number; maxScore: number; displayOrder: number; isRequired: boolean },
    actorId: string
  ): Promise<string> {
    if (data.weight < 0) throw new Error('Weight must be >= 0');
    if (data.maxScore <= 0) throw new Error('Max score must be > 0');

    return this.prisma.$transaction(async (tx) => {
      const version = await tx.rubricVersion.findUnique({ where: { id: rubricVersionId } });
      if (!version) throw new Error('RubricVersion not found');
      if (version.isPublished) throw new Error('Cannot modify a published rubric version');

      // Check for duplicate criterion name in the same version
      const existing = await tx.criterion.findFirst({
        where: { rubricVersionId, name: data.name }
      });
      if (existing) throw new Error('Criterion with this name already exists in this version');

      const criterion = await tx.criterion.create({
        data: {
          rubricVersionId,
          name: data.name,
          description: data.description || null,
          weight: data.weight,
          maxScore: data.maxScore,
          displayOrder: data.displayOrder,
          isRequired: data.isRequired
        }
      });

      // No need for a separate audit event for criterion add in the spec, but we can rely on version changes.

      return criterion.id;
    });
  }

  async publishRubricVersion(rubricVersionId: string, actorId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.rubricVersion.findUnique({
        where: { id: rubricVersionId },
        include: { criteria: true }
      });

      if (!version) throw new Error('RubricVersion not found');
      if (version.isPublished) throw new Error('RubricVersion is already published');

      if (version.criteria.length === 0) {
        throw new Error('Cannot publish a rubric version with no criteria');
      }

      let totalWeight = 0;
      for (const criterion of version.criteria) {
        if (criterion.weight < 0) throw new Error('Invalid weight configuration: weight < 0');
        if (criterion.maxScore <= 0) throw new Error('Invalid max score configuration: maxScore <= 0');
        totalWeight += criterion.weight;
      }

      // We allow floating point slight precision issues, but it should closely match 100
      if (Math.abs(totalWeight - 100) > 0.001) {
        throw new Error(`Criteria weights must sum to exactly 100%. Current sum: ${totalWeight}`);
      }

      await tx.rubricVersion.update({
        where: { id: rubricVersionId },
        data: { isPublished: true }
      });

      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.RUBRIC_VERSION_PUBLISHED,
          entity: 'RubricVersion',
          entityId: rubricVersionId,
          metadata: JsonField.serialize({ rubricId: version.rubricId, version: version.version })
        }
      });
    });
  }
}
