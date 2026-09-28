import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { JudgeService } from '../judging/management/JudgeService';
import { AssignmentService } from '../judging/assignment/AssignmentService';
import { RubricService } from '../judging/rubric/RubricService';
import { EvaluationService } from '../judging/evaluation/EvaluationService';
import { NormalizationService } from '../judging/normalization/NormalizationService';
import { AuditService } from '../judging/audit/AuditService';
import { SnapshotIntegrity } from '../judging/assignment/SnapshotIntegrity';

export function createJudgingRouter(prisma: PrismaClient) {
  const router = Router();
  
  const judgeService = new JudgeService(prisma);
  const assignmentService = new AssignmentService(prisma);
  const rubricService = new RubricService(prisma);
  const evaluationService = new EvaluationService(prisma);
  const normalizationService = new NormalizationService(prisma);
  const auditService = new AuditService(prisma);

  // Helper to extract actor from headers for auth simulation
  const getActorId = (req: Request) => {
    const actorId = req.headers['x-actor-id'] as string;
    if (!actorId) throw new Error('Unauthorized: x-actor-id header is missing');
    return actorId;
  };

  const successResponse = (res: Response, data?: any) => {
    return res.json({ success: true, data: data ?? null });
  };

  // --- 1. JUDGE MANAGEMENT ---
  router.post('/events/:eventId/judges/:judgeId/invite', async (req, res, next) => {
    try {
      const id = await judgeService.inviteJudge(req.params.eventId, req.params.judgeId, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.post('/events/:eventId/judges/:judgeId/accept', async (req, res, next) => {
    try {
      await judgeService.acceptInvitation(req.params.eventId, req.params.judgeId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.post('/events/:eventId/judges/:judgeId/suspend', async (req, res, next) => {
    try {
      await judgeService.suspendJudge(req.params.eventId, req.params.judgeId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.post('/events/:eventId/judges/:judgeId/reactivate', async (req, res, next) => {
    try {
      await judgeService.reactivateJudge(req.params.eventId, req.params.judgeId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.delete('/events/:eventId/judges/:judgeId', async (req, res, next) => {
    try {
      await judgeService.removeJudge(req.params.eventId, req.params.judgeId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.post('/projects/:projectId/judges/:judgeId/conflict', async (req, res, next) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing reason' } });
      const id = await judgeService.declareConflict(req.params.judgeId, req.params.projectId, reason, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.delete('/conflicts/:conflictId', async (req, res, next) => {
    try {
      await judgeService.resolveConflict(req.params.conflictId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.get('/events/:eventId/judges', async (req, res, next) => {
    try {
      const judges = await prisma.eventJudge.findMany({
        where: { eventId: req.params.eventId },
        include: { judge: true }
      });
      successResponse(res, judges);
    } catch (err) { next(err); }
  });

  // --- 2. ASSIGNMENTS ---
  router.post('/events/:eventId/assignments/run', async (req, res, next) => {
    try {
      const { kValue, forceNewRun } = req.body;
      if (typeof kValue !== 'number') return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid or missing kValue' } });
      const id = await assignmentService.generateAssignments(req.params.eventId, getActorId(req), kValue, forceNewRun);
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.get('/assignments/runs/:runId', async (req, res, next) => {
    try {
      const run = await prisma.assignmentRun.findUnique({ where: { id: req.params.runId } });
      if (!run) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } });
      successResponse(res, run);
    } catch (err) { next(err); }
  });

  router.get('/projects/:projectId/assignments', async (req, res, next) => {
    try {
      const assignments = await prisma.assignment.findMany({ where: { projectId: req.params.projectId, state: 'ACTIVE' } });
      successResponse(res, assignments);
    } catch (err) { next(err); }
  });

  router.get('/judges/:judgeId/assignments', async (req, res, next) => {
    try {
      const assignments = await prisma.assignment.findMany({ where: { judgeId: req.params.judgeId, state: 'ACTIVE' } });
      successResponse(res, assignments);
    } catch (err) { next(err); }
  });

  router.get('/assignments/:assignmentId/status', async (req, res, next) => {
    try {
      const assignment = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
      if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
      successResponse(res, { state: assignment.state });
    } catch (err) { next(err); }
  });

  router.get('/assignments/:assignmentId/lineage', async (req, res, next) => {
    try {
      const assignment = await prisma.assignment.findUnique({ 
        where: { id: req.params.assignmentId },
        include: { replacedAssignment: true, replacement: true }
      });
      if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
      successResponse(res, assignment);
    } catch (err) { next(err); }
  });

  // --- 3. RUBRICS ---
  router.post('/events/:eventId/rubrics', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing name' } });
      const id = await rubricService.createRubric(req.params.eventId, name, description, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.post('/rubrics/:rubricId/versions', async (req, res, next) => {
    try {
      const id = await rubricService.createRubricVersion(req.params.rubricId, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.post('/rubric-versions/:versionId/criteria', async (req, res, next) => {
    try {
      const { name, weight, maxScore } = req.body;
      if (!name || typeof weight !== 'number' || typeof maxScore !== 'number') {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing or invalid fields' } });
      }
      const id = await rubricService.addCriterion(req.params.versionId, req.body, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.post('/rubric-versions/:versionId/publish', async (req, res, next) => {
    try {
      await rubricService.publishRubricVersion(req.params.versionId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.get('/rubrics/:rubricId/published', async (req, res, next) => {
    try {
      const version = await prisma.rubricVersion.findFirst({
        where: { rubricId: req.params.rubricId, isPublished: true },
        orderBy: { version: 'desc' },
        include: { criteria: true }
      });
      if (!version) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No published version found' } });
      successResponse(res, version);
    } catch (err) { next(err); }
  });

  // --- 4. EVALUATIONS ---
  router.post('/assignments/:assignmentId/evaluations/start', async (req, res, next) => {
    try {
      const { rubricVersionId } = req.body;
      if (!rubricVersionId) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing rubricVersionId' } });
      const id = await evaluationService.startEvaluation(req.params.assignmentId, rubricVersionId, getActorId(req));
      successResponse(res, { id });
    } catch (err) { next(err); }
  });

  router.post('/evaluations/:evaluationId/draft', async (req, res, next) => {
    try {
      const { scores } = req.body;
      if (!scores) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing scores' } });
      await evaluationService.saveDraft(req.params.evaluationId, scores, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.post('/evaluations/:evaluationId/submit', async (req, res, next) => {
    try {
      const { scores } = req.body;
      if (!scores) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing scores' } });
      await evaluationService.submitEvaluation(req.params.evaluationId, scores, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.post('/evaluations/:evaluationId/reopen', async (req, res, next) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing reason' } });
      await evaluationService.reopenEvaluation(req.params.evaluationId, getActorId(req), reason);
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.get('/evaluations/:evaluationId', async (req, res, next) => {
    try {
      const evalData = await prisma.evaluation.findUnique({
        where: { id: req.params.evaluationId },
        include: { scores: true }
      });
      if (!evalData) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
      successResponse(res, evalData);
    } catch (err) { next(err); }
  });

  router.get('/judges/:judgeId/evaluations', async (req, res, next) => {
    try {
      const evals = await prisma.evaluation.findMany({
        where: { assignment: { judgeId: req.params.judgeId } }
      });
      successResponse(res, evals);
    } catch (err) { next(err); }
  });

  // --- 5. NORMALIZATION ---
  router.post('/events/:eventId/normalize', async (req, res, next) => {
    try {
      await normalizationService.runEventNormalization(req.params.eventId, getActorId(req));
      successResponse(res);
    } catch (err) { next(err); }
  });

  router.get('/evaluations/:evaluationId/normalization', async (req, res, next) => {
    try {
      const result = await prisma.normalizationResult.findUnique({
        where: { evaluationId: req.params.evaluationId }
      });
      successResponse(res, result);
    } catch (err) { next(err); }
  });

  router.get('/events/:eventId/aggregated-scores', async (req, res, next) => {
    try {
      const result = await normalizationService.getEventProjectAggregates(req.params.eventId);
      successResponse(res, result);
    } catch (err) { next(err); }
  });

  // --- 6. AUDIT ---
  router.get('/audit/entity/:entityName/:entityId', async (req, res, next) => {
    try {
      const trail = await auditService.getAuditTrail(req.params.entityName, req.params.entityId);
      successResponse(res, trail);
    } catch (err) { next(err); }
  });

  router.get('/audit/events/:eventId', async (req, res, next) => {
    try {
      const logs = await auditService.getEventAuditLogs(req.params.eventId);
      successResponse(res, logs);
    } catch (err) { next(err); }
  });

  router.get('/audit/actors/:actorId', async (req, res, next) => {
    try {
      const history = await auditService.getActorHistory(req.params.actorId);
      successResponse(res, history);
    } catch (err) { next(err); }
  });

  router.post('/audit/verify-snapshot', async (req, res, next) => {
    try {
      const { runId } = req.body;
      if (!runId) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing runId' } });
      const run = await prisma.assignmentRun.findUnique({ where: { id: runId } });
      if (!run) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } });
      const parsedPayload = typeof run.snapshotPayload === 'string' ? JSON.parse(run.snapshotPayload) : run.snapshotPayload;
      const verification = SnapshotIntegrity.verify(parsedPayload, run.snapshotHash);
      successResponse(res, verification);
    } catch (err) { next(err); }
  });

  router.post('/audit/verify-integrity', async (req, res, next) => {
    try {
      const { entityName, entityId } = req.body;
      let logs = [];
      if (entityName && entityId) {
        logs = await auditService.getAuditTrail(entityName, entityId);
      } else {
        logs = await prisma.auditLog.findMany({ orderBy: [{ timestamp: 'asc' }, { id: 'asc' }] });
      }
      const result = AuditService.verifyAuditIntegrity(logs);
      successResponse(res, result);
    } catch (err) { next(err); }
  });

  // Error Handler
  router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.message && err.message.includes('Unauthorized')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: err.message } });
    }
    if (err.message && (err.message.includes('not found') || err.message.includes('No pending') || err.message.includes('Not found'))) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    }
    if (err.message && (err.message.includes('already') || err.message.includes('Cannot') || err.message.includes('Invalid'))) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Internal Server Error' } });
  });

  return router;
}
