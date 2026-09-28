import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { EventsPage } from './pages/public/EventsPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { ProjectsGalleryPage } from './pages/public/ProjectsGalleryPage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';
import { ProfilePage } from './pages/public/ProfilePage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Participant Pages
import { ParticipantDashboard } from './pages/participant/ParticipantDashboard';
import { TeamManagementPage } from './pages/participant/TeamManagementPage';
import { ProjectBuilderPage } from './pages/participant/ProjectBuilderPage';
import { SubmissionReviewPage } from './pages/participant/SubmissionReviewPage';

// Judge Pages
import { JudgeDashboard } from './pages/judge/JudgeDashboard';
import { JudgeEventsPage } from './pages/judge/JudgeEventsPage';
import { JudgeEventSubmissionsPage } from './pages/judge/JudgeEventSubmissionsPage';
import { JudgeWorkspacePage } from './pages/judge/JudgeWorkspacePage';
import { JudgeEvaluationPage } from './pages/judge/JudgeEvaluationPage';

// Organizer Pages
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { EventEditorPage } from './pages/organizer/EventEditorPage';
import { EventOverviewPage } from './pages/organizer/EventOverviewPage';
import { EventTeamsPage } from './pages/organizer/EventTeamsPage';
import { EventProjectsPage } from './pages/organizer/EventProjectsPage';
import { EventSubmissionsPage } from './pages/organizer/EventSubmissionsPage';
import { JudgeManagementPage } from './pages/organizer/JudgeManagementPage';
import { JudgeConflictManagementPage } from './pages/organizer/JudgeConflictManagementPage';
import { AssignmentDashboardPage } from './pages/organizer/AssignmentDashboardPage';
import { RubricManagementPage } from './pages/organizer/RubricManagementPage';
import { NormalizationDashboardPage } from './pages/organizer/NormalizationDashboardPage';
import { AuditLogPage } from './pages/organizer/AuditLogPage';
import { ResultsPage } from './pages/organizer/ResultsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';

// Error Pages
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
              <Route path="/events/:eventId/projects" element={<ProjectsGalleryPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Authenticated Common Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer', 'judge', 'admin']}>
                    <ParticipantDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Participant Experience Routes (/participant & /dashboard aliases) */}
              <Route
                path="/participant"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <ParticipantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participant/team"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <TeamManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participant/project"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <ProjectBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participant/submission"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <SubmissionReviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy dashboard aliases for participant */}
              <Route
                path="/dashboard/team"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <TeamManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/project"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <ProjectBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/submissions"
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <SubmissionReviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Judge Experience Routes */}
              <Route
                path="/judge"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/events"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/events/:eventId/submissions"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeEventSubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/submissions/:submissionId"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/evaluations/:evaluationId"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/projects/:projectId"
                element={
                  <ProtectedRoute allowedRoles={['judge', 'organizer', 'admin']}>
                    <JudgeEvaluationPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Experience Routes */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <OrganizerEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/create"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/new"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/edit"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/teams"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventTeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/projects"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/submissions"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventSubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/judges"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <JudgeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/conflicts"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <JudgeConflictManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/conflicts"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <JudgeConflictManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/assignments"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <AssignmentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/assignments"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <AssignmentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/rubrics"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <RubricManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/rubrics"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <RubricManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/normalization"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <NormalizationDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/normalization"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <NormalizationDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/audit"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/audit"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:eventId/results"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <ResultsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Experience Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/teams"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSubmissionsPage />
                  </ProtectedRoute>
                }
              />

              {/* Error and Fallback Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
