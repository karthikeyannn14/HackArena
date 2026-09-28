import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi } from '../../api/projects';
import { submissionsApi } from '../../api/submissions';
import { judgingApi } from '../../api/judging';
import { Project, Submission, Rubric, Evaluation, CriterionScore } from '../../types';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const JudgeWorkspacePage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; comments: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReopened, setIsReopened] = useState(false);
  const [reopenedReason, setReopenedReason] = useState('');
  const [reopenedAt, setReopenedAt] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!submissionId) return;
      setIsLoading(true);
      try {
        const judgeId = user?.id || 'usr_judge_1';
        
        // Check if submissionId is directly a project ID or a submission ID
        let targetProjectId = submissionId;
        const allSubs = await submissionsApi.getSubmissions();
        const foundSub = allSubs.find((s: Submission) => s.id === submissionId);
        if (foundSub) {
          targetProjectId = foundSub.projectId;
        }

        const prj = await projectsApi.getProject(targetProjectId);
        setProject(prj);

        if (prj) {
          const rbc = await judgingApi.getRubric(prj.eventId);
          setRubric(rbc);

          const existingEval = await judgingApi.getEvaluationForProject(targetProjectId, judgeId);
          if (existingEval) {
            setOverallFeedback(existingEval.overallFeedback || '');
            setIsSubmitted(existingEval.isSubmitted);
            setIsReopened(!!existingEval.isReopened);
            setReopenedReason(existingEval.reopenedReason || '');
            setReopenedAt(existingEval.reopenedAt || '');
            setSubmittedAt(existingEval.submittedAt || existingEval.updatedAt || '');

            const scoreMap: Record<string, { score: number; comments: string }> = {};
            existingEval.scores.forEach(s => {
              scoreMap[s.criterionId] = { score: s.score, comments: s.comments };
            });
            setScores(scoreMap);
          } else {
            const blankScores: Record<string, { score: number; comments: string }> = {};
            rbc.criteria.forEach(c => {
              blankScores[c.id] = { score: 7, comments: '' };
            });
            setScores(blankScores);
          }
        }
      } catch (err) {
        console.error('Failed to load judging workspace:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [submissionId, user?.id]);

  const handleScoreChange = (criterionId: string, val: number) => {
    if (isSubmitted) return;
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { comments: '' }),
        score: Math.max(0, Math.min(10, val)),
      },
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    if (isSubmitted) return;
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { score: 7 }),
        comments: comment,
      },
    }));
  };

  const calculateTotal = (): number => {
    if (!rubric) return 0;
    let total = 0;
    rubric.criteria.forEach(c => {
      const s = scores[c.id]?.score || 0;
      total += (s / c.maxScore) * c.weight;
    });
    return Math.round(total * 10) / 10;
  };

  const handleSaveEvaluation = async (submitFinal: boolean = false) => {
    if (!project || !rubric) return;
    setIsSaving(true);
    try {
      const judgeId = user?.id || 'usr_judge_1';
      const judgeName = user?.name || 'Dr. Marcus Vance';

      const criterionScores: CriterionScore[] = rubric.criteria.map(c => ({
        criterionId: c.id,
        criterionName: c.name,
        score: scores[c.id]?.score ?? 7,
        comments: scores[c.id]?.comments || '',
        weight: c.weight,
      }));

      await judgingApi.saveEvaluation({
        id: `eval_${project.id}_${judgeId}`,
        assignmentId: `asg_${project.id}`,
        judgeId,
        judgeName,
        projectId: project.id,
        scores: criterionScores,
        totalWeightedScore: calculateTotal(),
        overallFeedback,
        isSubmitted: submitFinal,
        updatedAt: new Date().toISOString(),
      });

      setIsSubmitted(submitFinal);
      showToast(
        submitFinal ? 'Evaluation Submitted' : 'Draft Saved',
        submitFinal
          ? `Final evaluation for ${project.title} recorded.`
          : 'Your preliminary scores have been saved.',
        'success'
      );

      if (submitFinal) {
        navigate('/judge');
      }
    } catch {
      showToast('Error', 'Failed to save evaluation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project || !rubric) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">Submission Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">Could not find project details for judging.</p>
        <Link to="/judge" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const weightedTotal = calculateTotal();

  return (
    <div className="flex-1 bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Workspace Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/judge" className="hover:text-slate-900">Judge</Link>
              <span>/</span>
              <Link to="/judge/events" className="hover:text-slate-900">Competitions</Link>
              <span>/</span>
              <span className="text-slate-900 font-mono text-[11px]">{submissionId}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Workspace: {project.title}</span>
              {isSubmitted && (
                <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Evaluation Submitted
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Team: <strong className="text-slate-800 font-medium">{project.teamName}</strong> · Track: {project.trackName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">
                Current Weighted Score
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                {weightedTotal} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </span>
            </div>
          </div>
        </div>

        {/* Reopened Banner (Section 18 Requirement) */}
        {isReopened && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-xs text-amber-900 space-y-1 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
              <span className="font-bold text-sm tracking-tight text-amber-900 uppercase">
                Evaluation Reopened by Organizer
              </span>
            </div>
            <p className="text-amber-800">
              The organizer has officially reopened this evaluation for revision.
              {reopenedReason && <span> Reason: <strong>"{reopenedReason}"</strong></span>}
            </p>
            {reopenedAt && (
              <span className="text-[11px] font-mono text-amber-700 block mt-1">
                Authorization Timestamp: {reopenedAt}
              </span>
            )}
          </div>
        )}

        {/* Submitted Locked Banner */}
        {isSubmitted && !isReopened && (
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 text-xs flex items-center justify-between text-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-900">
                Evaluation Locked & Finalized
              </span>
              <span className="text-slate-500">
                · Final evaluation submitted on {submittedAt || '2026-10-15T10:45:00Z'}. Resubmission is prevented.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-300">
              Locked
            </span>
          </div>
        )}

        {/* Split View: Left (Project Info) & Right (Rubric & Scoring) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Project Submission Details */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Tagline & Overview
                </h3>
                <p className="text-sm font-medium text-slate-900">{project.tagline}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Problem Statement
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                  {project.problem}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Engineered Solution
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                  {project.solution}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Key Technical Features
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {project.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Technologies & Frameworks
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map(tech => (
                    <span
                      key={tech}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-200"
                  >
                    Open Live Demo ↗
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-200"
                  >
                    Source Repository ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Rubric Scoring */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Official Judging Rubric
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  {rubric.criteria.length} Criteria · Total 100%
                </span>
              </div>

              <div className="space-y-5">
                {rubric.criteria.map(c => {
                  const currentScore = scores[c.id]?.score ?? 7;
                  const currentComment = scores[c.id]?.comments || '';

                  return (
                    <div key={c.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.description}</p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 shrink-0">
                          Weight: {c.weight}%
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Score:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {currentScore} / {c.maxScore}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={c.maxScore}
                          step="1"
                          value={currentScore}
                          disabled={isSubmitted}
                          onChange={e => handleScoreChange(c.id, Number(e.target.value))}
                          className="w-full accent-slate-900 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      <Textarea
                        placeholder={`Provide qualitative notes on ${c.name.toLowerCase()}...`}
                        rows={2}
                        value={currentComment}
                        disabled={isSubmitted}
                        onChange={e => handleCommentChange(c.id, e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Overall Feedback */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Overall Synthesis & Judge Feedback
                </label>
                <Textarea
                  placeholder="Summarize key architectural highlights, performance trade-offs, and constructive guidance for the engineering team..."
                  rows={3}
                  value={overallFeedback}
                  disabled={isSubmitted}
                  onChange={e => setOverallFeedback(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitted || isSaving}
                  onClick={() => handleSaveEvaluation(false)}
                >
                  Save Draft
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmitted || isSaving}
                  isLoading={isSaving}
                  onClick={() => handleSaveEvaluation(true)}
                >
                  {isSubmitted ? 'Submitted' : 'Submit Final Evaluation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
