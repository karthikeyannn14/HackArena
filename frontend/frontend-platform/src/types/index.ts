export type Role = 'public' | 'participant' | 'judge' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  bio?: string;
  organization?: string;
  status?: 'active' | 'suspended';
  skills?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  createdAt?: string;
}

export type EventStatus = 
  | 'upcoming' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'live' 
  | 'completed';

export interface Track {
  id: string;
  name: string;
  description: string;
  prizePool: string;
  color?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'milestone' | 'workshop' | 'deadline' | 'ceremony';
}

export interface PrizeItem {
  id: string;
  title: string;
  amount: string;
  trackId?: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Event {
  id: string;
  title: string;
  tagline: string;
  description: string;
  bannerTheme: string;
  organizerName: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  judgingStartDate: string;
  judgingEndDate: string;
  tracks: Track[];
  rules: string[];
  schedule: ScheduleItem[];
  prizes: PrizeItem[];
  faqs: FAQItem[];
  participantCount: number;
  projectCount: number;
  prizeTotal: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'leader' | 'member';
  avatar?: string;
  skills?: string[];
}

export interface Invitation {
  id: string;
  email: string;
  role: 'member';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  description: string;
  leaderId: string;
  leaderName: string;
  members: TeamMember[];
  invitations: Invitation[];
  createdAt: string;
  projectId?: string;
}

export type ProjectStatus = 'draft' | 'submitted' | 'under_review' | 'evaluated';

export interface Project {
  id: string;
  eventId: string;
  eventTitle: string;
  teamId: string;
  teamName: string;
  title: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  features: string[];
  technologies: string[];
  trackId: string;
  trackName: string;
  demoUrl: string;
  repoUrl: string;
  mediaUrls: string[];
  videoUrl?: string;
  status: ProjectStatus;
  submissionDate?: string;
  submissionId?: string;
  teamMembers: { id: string; name: string; role: string; avatar?: string }[];
}

export interface Submission {
  id: string;
  projectId: string;
  eventId: string;
  teamId: string;
  submittedAt: string;
  status: 'submitted' | 'accepted';
  version: number;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage, e.g. 25
  maxScore: number; // e.g. 10
}

export interface Rubric {
  id: string;
  eventId: string;
  criteria: Criterion[];
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  organization: string;
  avatar?: string;
  assignedProjectIds: string[];
  completedCount: number;
  pendingCount: number;
  conflictsCount?: number;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED' | 'active' | 'invited';
}

export type JudgeConflictReason = 'OWN_TEAM' | 'OWN_PROJECT' | 'DECLARED' | 'PROHIBITED_RELATIONSHIP';
export type JudgeConflictStatus = 'ACTIVE' | 'RESOLVED';

export interface JudgeConflict {
  id: string;
  eventId: string;
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  projectId: string;
  projectTitle: string;
  teamName?: string;
  reason: JudgeConflictReason;
  status: JudgeConflictStatus;
  declaredAt: string;
  resolvedAt?: string;
  notes?: string;
}

export type AssignmentRunStatus = 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_EXCEPTIONS' | 'FAILED' | 'SUPERSEDED';

export interface UnresolvedProject {
  projectId: string;
  projectTitle: string;
  teamName: string;
  trackName: string;
  reason: string;
  shortfall: number;
}

export interface AssignmentRun {
  id: string;
  eventId: string;
  algorithmVersion: string;
  kValue: number;
  status: AssignmentRunStatus;
  totalAssignments: number;
  unresolvedProjectsCount: number;
  unresolvedProjects: UnresolvedProject[];
  createdAt: string;
  completedAt?: string;
  executionTimeMs?: number;
}

export type AssignmentState = 'ACTIVE' | 'SUPERSEDED' | 'DROPPED';
export type EvaluationStatus = 'not_started' | 'in_progress' | 'completed' | 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

export interface AssignmentLineageStep {
  timestamp: string;
  action: string;
  fromAssignmentId?: string;
  toAssignmentId?: string;
  reason: string;
  actor: string;
}

export interface Assignment {
  id: string;
  runId?: string;
  eventId: string;
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  projectId: string;
  projectTitle: string;
  trackName: string;
  teamName: string;
  status: EvaluationStatus;
  assignmentState?: AssignmentState;
  assignedAt: string;
  supersededBy?: string;
  supersededReason?: string;
  lineage?: AssignmentLineageStep[];
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  comments: string;
  weight: number;
}

export interface RubricVersionCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface RubricVersion {
  version: number;
  status: 'DRAFT' | 'PUBLISHED';
  criteria: RubricVersionCriterion[];
  publishedAt?: string;
  publishedBy?: string;
  changeNotes?: string;
}

export interface RubricDefinition {
  id: string;
  eventId: string;
  name: string;
  activeVersion: number;
  versions: RubricVersion[];
}

export interface Evaluation {
  id: string;
  assignmentId: string;
  eventId?: string;
  judgeId: string;
  judgeName: string;
  projectId: string;
  projectTitle?: string;
  scores: CriterionScore[];
  totalWeightedScore?: number;
  totalRawScore?: number;
  overallFeedback?: string;
  status?: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
  isSubmitted: boolean;
  isReopened?: boolean;
  reopenedAt?: string;
  reopenedReason?: string;
  submittedAt?: string;
  updatedAt: string;
}

export type NormalizationStatus = 'NORMALIZED' | 'INSUFFICIENT_SAMPLE' | 'ZERO_VARIANCE' | 'UNAVAILABLE' | 'FAILED';
export type AggregationStatus = 'AGGREGATED' | 'INSUFFICIENT_DATA';

export interface NormalizationResult {
  evaluationId: string;
  projectId: string;
  projectTitle: string;
  judgeId: string;
  judgeName: string;
  rawScore: number;
  normalizationStatus: NormalizationStatus;
  normalizedValue: number | null;
  judgeSampleSize: number;
  judgeMean: number | null;
  judgeStdDev: number | null;
}

export interface ProjectAggregationResult {
  projectId: string;
  projectTitle: string;
  teamName: string;
  trackName: string;
  aggregationStatus: AggregationStatus;
  normalizedProjectScore: number | null;
  usableEvaluationsCount: number;
  totalEvaluationsCount: number;
  rank?: number;
}

export type AuditLogAction =
  | 'JUDGE_INVITED'
  | 'JUDGE_ACCEPTED'
  | 'JUDGE_SUSPENDED'
  | 'JUDGE_REACTIVATED'
  | 'JUDGE_REMOVED'
  | 'JUDGE_CONFLICT_DECLARED'
  | 'JUDGE_CONFLICT_REMOVED'
  | 'ASSIGNMENT_RUN_CREATED'
  | 'ASSIGNMENT_BLOCKED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_REPLACED'
  | 'RUBRIC_CREATED'
  | 'RUBRIC_VERSION_CREATED'
  | 'RUBRIC_VERSION_PUBLISHED'
  | 'EVALUATION_STARTED'
  | 'EVALUATION_DRAFT_SAVED'
  | 'EVALUATION_SUBMITTED'
  | 'EVALUATION_REOPENED'
  | 'NORMALIZATION_RUN';

export interface AuditLogEntry {
  id: string;
  eventId: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: AuditLogAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export interface Result {
  rank: number;
  projectId: string;
  projectTitle: string;
  teamName: string;
  trackName: string;
  finalScore: number;
  status: 'winner' | 'runner_up' | 'finalist' | 'completed';
  awards?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}
