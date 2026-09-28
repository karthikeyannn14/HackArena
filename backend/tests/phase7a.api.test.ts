import * as request from 'supertest';
import { app, prisma } from '../src/api/app';

describe('Phase 7A/7B API Contract Tests', () => {

  let eventId = 'test-event-id';
  let judgeId = 'test-judge-id';
  let actorId = 'test-actor-id';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      // Setup some basic data
      const event = await prisma.event.create({ data: { id: eventId, name: 'API Test Event' } });
      const judge = await prisma.judge.create({ data: { id: judgeId, userId: actorId } });
    } catch (e) {
      console.warn('DB unreachable, API tests will skip DB-dependent setup');
    }
  });

  afterAll(async () => {
    try {
      await prisma.eventJudge.deleteMany({ where: { eventId } });
      await prisma.judge.deleteMany({ where: { id: judgeId } });
      await prisma.event.deleteMany({ where: { id: eventId } });
    } catch (e) {}
    await prisma.$disconnect();
  });

  it('Judge Invitation: POST /api/judging/events/:eventId/judges/:judgeId/invite', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; } 

    const res = await request(app)
      .post(`/api/judging/events/${eventId}/judges/${judgeId}/invite`)
      .set('x-actor-id', 'admin-actor-1')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('Assignment Retrieval: GET /api/judging/judges/:judgeId/assignments', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; }

    const res = await request(app)
      .get(`/api/judging/judges/${judgeId}/assignments`)
      .set('x-actor-id', actorId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Validation Failure Shape (Bad Request)', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; }

    const res = await request(app)
      .post(`/api/judging/events/${eventId}/rubrics`)
      .set('x-actor-id', actorId)
      .send({}); // missing 'name'

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'BAD_REQUEST');
  });

  it('Authorization Failure Mapping', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; }

    const res = await request(app)
      .post(`/api/judging/events/${eventId}/judges/${judgeId}/accept`)
      .send({}); // Missing x-actor-id header

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Not-Found Mapping', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; }

    const res = await request(app)
      .get('/api/judging/rubrics/missing-rubric-id/published')
      .set('x-actor-id', actorId);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Audit Retrieval: GET /api/judging/audit/actors/:actorId', async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch(e) { return; }

    const res = await request(app)
      .get(`/api/judging/audit/actors/${actorId}`)
      .set('x-actor-id', actorId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
