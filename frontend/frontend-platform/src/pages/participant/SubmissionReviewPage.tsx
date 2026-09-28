import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi } from '../../api/projects';
import { teamsApi } from '../../api/teams';
import { eventsApi } from '../../api/events';
import { submissionsApi } from '../../api/submissions';
import { Project, Event, Team } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const SubmissionReviewPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const evts = await eventsApi.getEvents();
        const activeEvt = evts[0];
        setEvent(activeEvt);

        const myTeam = await teamsApi.getMyTeam(activeEvt?.id, user.id);
        setTeam(myTeam);

        if (myTeam) {
          const prj = await projectsApi.getProjectByTeam(myTeam.id);
          setProject(prj);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSubmitProject = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const res = await submissionsApi.submitProject(project.id);
      setProject(res.project);
      showToast('Project Submitted!', `Confirmation ID: ${res.submission.id}`, 'success');
      setConfirmModalOpen(false);
    } catch (err: any) {
      showToast('Submission failed', err?.message || 'Please check all required fields.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="text-base font-bold text-slate-900">No Project to Submit</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6">
            You must fill in your project details in the Project Builder before reviewing submission readiness.
          </p>
          <Link to="/dashboard/project">
            <Button variant="primary" size="sm">Go to Project Builder</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pre-flight validation checklist
  const checks = [
    { label: 'Project Title & Tagline', valid: Boolean(project.title && project.tagline) },
    { label: 'Assigned Challenge Track', valid: Boolean(project.trackId) },
    { label: 'Problem Statement & Architecture', valid: Boolean(project.problem && project.solution) },
    { label: 'Technologies & Frameworks Listed', valid: Boolean(project.technologies?.length > 0) },
    { label: 'Interactive Live Demo Link', valid: Boolean(project.demoUrl) },
    { label: 'Public Source Code Repository', valid: Boolean(project.repoUrl) },
    { label: 'Team Roster Verified', valid: Boolean(team && team.members.length > 0) },
  ];

  const allPassed = checks.every(c => c.valid);
  const isSubmitted = project.status === 'submitted';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Participant Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Submission Review & Lock
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Verify all submission criteria before sealing your entry for peer and expert evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/project">
            <Button variant="outline" size="sm">
              Edit Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Submitted Confirmation State Banner */}
      {isSubmitted && (
        <div className="my-6 rounded-lg border border-emerald-300 bg-emerald-50/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <span>✓ Official Submission Confirmed</span>
              </div>
              <h2 className="text-lg font-bold text-emerald-950">
                {project.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-800 font-mono">
                <span>ID: {project.submissionId}</span>
                <span>·</span>
                <span>Submitted: {new Date(project.submissionDate || '').toLocaleString()}</span>
                <span>·</span>
                <StatusBadge status="submitted" />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/projects/${project.id}`}>
                <Button variant="primary" size="sm">
                  View Public Record →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary Box */}
      <div className="my-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono text-slate-500 uppercase">Project Record</span>
            <StatusBadge status={project.status} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{project.tagline}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Participating Team</span>
            <span className="font-semibold text-slate-800">{team?.name || project.teamName}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Evaluation Track</span>
            <span className="font-semibold text-slate-800">{project.trackName}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Competition Deadline</span>
            <span className="font-semibold text-slate-800 font-mono">Oct 14, 23:59 UTC</span>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Pre-Flight Checklist
          </h4>
          <div className="space-y-2">
            {checks.map((chk, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-700">{chk.label}</span>
                {chk.valid ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span>Passed</span>
                    <span className="font-bold">✓</span>
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <span>Incomplete</span>
                    <span>✕</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory Warning Notice */}
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">Important Submission Policy</p>
          <p>
            Once submitted, your project may no longer be editable after the submission deadline. Repositories and live demonstrations will be snapshotted and queued for independent rubric scoring.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/project')}>
            ← Back to Builder
          </Button>

          {!isSubmitted ? (
            <Button
              variant="primary"
              size="md"
              disabled={!allPassed}
              onClick={() => setConfirmModalOpen(true)}
            >
              Submit Project For Judging
            </Button>
          ) : (
            <span className="text-xs font-mono text-emerald-700 font-semibold">
              Entry Locked & In Judging Queue
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Final Submission"
        description="Are you sure you are ready to submit this project? Your entry will be officially registered with the judging council."
      >
        <div className="space-y-3 text-xs text-slate-700">
          <p>
            You are submitting <strong>{project.title}</strong> on behalf of team <strong>{team?.name}</strong>.
          </p>
          <div className="p-3 bg-slate-100 rounded text-slate-600 font-mono text-[11px]">
            Target Track: {project.trackName}
          </div>
          <p className="text-slate-500">
            Clicking confirm will generate an immutable submission token and lock your code links for judging deliberation.
          </p>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitProject}
            isLoading={isSubmitting}
          >
            Confirm & Submit Project
          </Button>
        </div>
      </Modal>
    </div>
  );
};
