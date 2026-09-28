import { PrismaClient } from '@prisma/client';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { JudgeService } from './src/judging/management/JudgeService';
import { AssignmentService } from './src/judging/assignment/AssignmentService';
import { EvaluationService } from './src/judging/evaluation/EvaluationService';
import { RubricService } from './src/judging/rubric/RubricService';
import { NormalizationService } from './src/judging/normalization/NormalizationService';
import { AuditService } from './src/judging/audit';

const app = require('./backend-platform/backend/src/app.js');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'devpulse_jwt_token_secret';

// Actor Bridge Middleware (Prevents spoofing)
const actorBridge = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.headers['x-actor-id'] = decoded.userId || decoded.id;
      req.headers['x-user-role'] = decoded.role;
    } catch (e) {
      delete req.headers['x-actor-id'];
    }
  } else {
    delete req.headers['x-actor-id'];
  }
  next();
};

const judgingRouter = express.Router();
judgingRouter.use(actorBridge);

// Helper for extracting actor
const getActorId = (req: any) => {
  const actorId = req.headers['x-actor-id'];
  if (!actorId) throw new Error('Unauthorized: No valid actor identity');
  return actorId as string;
};

const judgeService = new JudgeService(prisma);
const assignmentService = new AssignmentService(prisma);
const evaluationService = new EvaluationService(prisma);
const rubricService = new RubricService(prisma);
const normalizationService = new NormalizationService(prisma);
const auditService = new AuditService(prisma);

// GET Assignments
judgingRouter.get('/assignments/me', async (req: any, res: any) => {
  try {
    const actorId = getActorId(req);
    const judge = await prisma.judge.findUnique({ where: { userId: actorId } });
    if (!judge) return res.status(404).json({ success: false, error: 'Not a judge' });
    const assignments = await prisma.assignment.findMany({
      where: { judgeId: judge.id, state: 'ACTIVE' },
      include: { project: true, evaluation: true }
    });
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

// Generate Assignments
judgingRouter.post('/assignments/generate', async (req: any, res: any) => {
  try {
    const { eventId, kValue } = req.body;
    const actorId = getActorId(req);
    const runId = await assignmentService.generateAssignments(eventId, actorId, kValue || 2);
    res.json({ success: true, data: { runId } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Start Evaluation
judgingRouter.post('/evaluations/:assignmentId/start', async (req: any, res: any) => {
  try {
    const { assignmentId } = req.params;
    const actorId = getActorId(req);
    // Find published rubric for project event
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { project: true } });
    if (!assignment) throw new Error("Assignment not found");
    const rubrics = await prisma.rubricVersion.findMany({
      where: { rubric: { eventId: assignment.project.eventId }, isPublished: true },
      orderBy: { version: 'desc' },
      take: 1,
      include: { criteria: true }
    });
    if (rubrics.length === 0) throw new Error("No published rubric found");
    
    const evalId = await evaluationService.startEvaluation(assignmentId, rubrics[0]!.id, actorId);
    res.json({ success: true, data: { evaluationId: evalId, rubric: rubrics[0] } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Submit Evaluation
judgingRouter.post('/evaluations/:evaluationId/submit', async (req: any, res: any) => {
  try {
    const { evaluationId } = req.params;
    const { scores } = req.body;
    const actorId = getActorId(req);
    await evaluationService.submitEvaluation(evaluationId, scores, actorId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Run Normalization
judgingRouter.post('/normalization/run', async (req: any, res: any) => {
  try {
    const { eventId } = req.body;
    const actorId = getActorId(req);
    const result = await normalizationService.runEventNormalization(eventId, actorId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get Final Project Scores
judgingRouter.get('/results/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    const results = await normalizationService.getEventProjectAggregates(eventId);
    const enriched = await Promise.all(results.map(async r => {
      const p = await prisma.project.findUnique({ where: { id: r.projectId } });
      return { ...r, projectName: p?.name };
    }));
    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add the judging routes to the imported unified app
app.use('/api/judging', judgingRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Unified Server (Prisma + Express) running at http://localhost:${port}`);
});
