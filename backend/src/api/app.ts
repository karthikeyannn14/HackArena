import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import { createJudgingRouter } from './judging.routes';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
app.use('/api/judging', createJudgingRouter(prisma));

export { app, prisma };
