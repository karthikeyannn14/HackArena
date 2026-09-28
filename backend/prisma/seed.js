/**
 * Deterministic Demo Seed
 * 
 * Creates a complete demo dataset for offline hackathon demonstration.
 * 
 * Demo Credentials:
 *   Organizer: organizer@demo.dev / demo1234
 *   Judge 1:   judge1@demo.dev   / demo1234
 *   Judge 2:   judge2@demo.dev   / demo1234
 *   Member 1:  member1@demo.dev  / demo1234
 *   Member 2:  member2@demo.dev  / demo1234
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding demo data...');

  // Clear existing data (safe for development)
  await prisma.auditLog.deleteMany();
  await prisma.normalizationResult.deleteMany();
  await prisma.criterionScore.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.assignmentRun.deleteMany();
  await prisma.judgeConflict.deleteMany();
  await prisma.eventJudge.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.rubricVersion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.track.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin', 12);
  const judgePassword = await bcrypt.hash('judge', 12);
  const userPassword = await bcrypt.hash('demo1234', 12);

  // Users
  const organizer = await prisma.user.create({
    data: { id: 'seed-user-organizer', name: 'Demo Organizer', email: 'admin@demo.com', password: adminPassword, role: 'ORGANIZER' }
  });
  const judge1 = await prisma.user.create({
    data: { id: 'seed-user-judge1', name: 'Judge Alpha', email: 'judge1@demo.com', password: judgePassword, role: 'JUDGE' }
  });
  const judge2 = await prisma.user.create({
    data: { id: 'seed-user-judge2', name: 'Judge Beta', email: 'judge2@demo.com', password: judgePassword, role: 'JUDGE' }
  });
  const member1 = await prisma.user.create({
    data: { id: 'seed-user-member1', name: 'Alice Dev', email: 'member1@demo.dev', password: userPassword, role: 'PARTICIPANT' }
  });
  const member2 = await prisma.user.create({
    data: { id: 'seed-user-member2', name: 'Bob Builder', email: 'member2@demo.dev', password: userPassword, role: 'PARTICIPANT' }
  });

  // Event
  const now = new Date();
  const event = await prisma.event.create({
    data: {
      id: 'seed-event-1',
      name: 'DevPulse Hackathon 2026',
      description: 'Annual hackathon for innovative software projects.',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      registrationStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      registrationEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      submissionDeadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
      status: 'PUBLISHED',
      organizerId: organizer.id,
    }
  });

  // Track
  const track = await prisma.track.create({
    data: { id: 'seed-track-1', name: 'Open Innovation', eventId: event.id }
  });

  // Teams & Members
  const team1 = await prisma.team.create({
    data: {
      id: 'seed-team-1',
      name: 'Team Rocket',
      eventId: event.id,
      ownerId: member1.id,
      members: { create: { userId: member1.id, role: 'OWNER' } }
    }
  });
  const team2 = await prisma.team.create({
    data: {
      id: 'seed-team-2',
      name: 'Team Nova',
      eventId: event.id,
      ownerId: member2.id,
      members: { create: { userId: member2.id, role: 'OWNER' } }
    }
  });

  // Projects
  const project1 = await prisma.project.create({
    data: {
      id: 'seed-project-1',
      name: 'NeuralKV Cache',
      description: 'Speculative prefetch cache for LLM decoders.',
      eventId: event.id,
      teamId: team1.id,
      trackId: track.id,
      status: 'SUBMITTED',
    }
  });
  const project2 = await prisma.project.create({
    data: {
      id: 'seed-project-2',
      name: 'AegisRaft Engine',
      description: 'Distributed consensus engine for edge deployments.',
      eventId: event.id,
      teamId: team2.id,
      trackId: track.id,
      status: 'SUBMITTED',
    }
  });

  // Submissions
  await prisma.submission.create({
    data: {
      projectId: project1.id,
      teamId: team1.id,
      eventId: event.id,
      title: 'NeuralKV: Speculative Prefetch Cache',
      description: 'A speculative memory prefetch layer using Markov transition predictor.',
      repositoryUrl: 'https://github.com/demo/neuralkv',
      status: 'SUBMITTED',
      submittedAt: new Date()
    }
  });
  await prisma.submission.create({
    data: {
      projectId: project2.id,
      teamId: team2.id,
      eventId: event.id,
      title: 'AegisRaft: Edge Consensus',
      description: 'Byzantine fault-tolerant Raft implementation for edge nodes.',
      repositoryUrl: 'https://github.com/demo/aegisraft',
      status: 'SUBMITTED',
      submittedAt: new Date()
    }
  });

  // Judges
  const judgeRecord1 = await prisma.judge.create({
    data: { id: 'seed-judge-1', userId: judge1.id, isActive: true }
  });
  const judgeRecord2 = await prisma.judge.create({
    data: { id: 'seed-judge-2', userId: judge2.id, isActive: true }
  });

  // EventJudges (ACTIVE)
  await prisma.eventJudge.create({
    data: { eventId: event.id, judgeId: judgeRecord1.id, status: 'ACTIVE' }
  });
  await prisma.eventJudge.create({
    data: { eventId: event.id, judgeId: judgeRecord2.id, status: 'ACTIVE' }
  });

  // Rubric
  const rubric = await prisma.rubric.create({
    data: {
      id: 'seed-rubric-1',
      eventId: event.id,
      name: 'Standard Evaluation Rubric',
      description: 'Assesses innovation, technical depth, and impact.',
    }
  });
  const rubricVersion = await prisma.rubricVersion.create({
    data: {
      rubricId: rubric.id,
      version: 1,
      isPublished: true,
      criteria: {
        create: [
          { name: 'Innovation', description: 'Originality and creativity', weight: 0.4, maxScore: 10, displayOrder: 1 },
          { name: 'Technical Depth', description: 'Code quality and architecture', weight: 0.4, maxScore: 10, displayOrder: 2 },
          { name: 'Impact', description: 'Potential real-world impact', weight: 0.2, maxScore: 10, displayOrder: 3 },
        ]
      }
    },
    include: { criteria: true }
  });

  console.log('✅  Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  admin@demo.com      / admin (ORGANIZER)');
  console.log('  judge1@demo.com     / judge (JUDGE)');
  console.log('  judge2@demo.com     / judge (JUDGE)');
  console.log('  member1@demo.dev    / demo1234 (PARTICIPANT)');
  console.log('  member2@demo.dev    / demo1234 (PARTICIPANT)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
