import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi } from '../../api/projects';
import { judgingApi } from '../../api/judging';
import { Project, Rubric, Evaluation, CriterionScore } from '../../types';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const JudgeEvaluationPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignmentId');

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; comments: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // For next / prev project navigation
  const [allAssignments, setAllAssignments] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const judgeId = user?.id || 'usr_judge_1';
        const prj = await projectsApi.getProject(projectId);
        setProject(prj);

        if (prj) {
          const rbc = await judgingApi.getRubric(prj.eventId);
          setRubric(rbc);

          // Load previous evaluation if exists
          const existingEval = await judgingApi.getEvaluationForProject(projectId, judgeId);
          if (existingEval) {
            setEvaluation(existingEval);
            setOverallFeedback(existingEval.overallFeedback || '');
            setIsSubmitted(existingEval.isSubmitted);

            const scoreMap: Record<string, { score: number; comments: string }> = {};
            existingEval.scores.forEach(s => {
              scoreMap[s.criterionId] = { score: s.score, comments: s.comments };
            });
            setScores(scoreMap);
          } else {
            // Initialize blank scores
            const scoreMap: Record<string, { score: number; comments: string }> = {};
            rbc.criteria.forEach(c => {
              scoreMap[c.id] = { score: 8.0, comments: '' };
            });
            setScores(scoreMap);
          }
        }

        // Get all judge assignments for navigation
        const asgs = await judgingApi.getAssignments('evt_nexus_2026', judgeId);
        setAllAssignments(asgs.map(a => a.projectId));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [projectId, user]);

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score: Math.min(10, Math.max(1, score)),
      },
    }));
  };

  const handleCommentsChange = (criterionId: string, comments: string) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        comments,
      },
    }));
  };

  // Compute live weighted score preview
  const calculateWeightedScore = () => {
    if (!rubric) return 0;
    let total = 0;
    rubric.criteria.forEach(c => {
      const s = scores[c.id]?.score ?? 0;
      total += s * (c.weight / 100);
    });
    return Math.round(total * 100) / 100;
  };

  const handleSave = async (submitFinal = false) => {
    if (!project || !rubric) return;
    setIsSaving(true);
    try {
      const judgeId = user?.id || 'usr_judge_1';
      const judgeName = user?.name || 'Dr. Marcus Vance';
      const assignmentId = assignmentIdParam || `asg_${project.id}`;

      const scoreList: CriterionScore[] = rubric.criteria.map(c => ({
        criterionId: c.id,
        criterionName: c.name,
        weight: c.weight,
        score: scores[c.id]?.score ?? 8.0,
        comments: scores[c.id]?.comments ?? '',
      }));

      const payload: Evaluation = {
        id: evaluation?.id || `eval_${Date.now()}`,
        assignmentId,
        judgeId,
        judgeName,
        projectId: project.id,
        scores: scoreList,
        totalWeightedScore: calculateWeightedScore(),
        overallFeedback,
        isSubmitted: submitFinal,
        updatedAt: new Date().toISOString(),
      };

      const saved = await judgingApi.saveEvaluation(payload);
      setEvaluation(saved);
      setIsSubmitted(submitFinal);

      if (submitFinal) {
        showToast('Evaluation Submitted', `Score ${saved.totalWeightedScore?.toFixed(2)} finalized.`, 'success');
      } else {
        showToast('Draft Saved', 'Evaluation scores synced safely.', 'info');
      }
    } catch (err: any) {
      showToast('Error saving evaluation', err?.message || 'Check connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project || !rubric) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="text-base font-bold text-slate-900">Project Not Found</h2>
        <Link to="/judge" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Assigned Projects</Button>
        </Link>
      </div>
    );
  }

  const currentIdx = allAssignments.indexOf(project.id);
  const prevProjectId = currentIdx > 0 ? allAssignments[currentIdx - 1] : null;
  const nextProjectId = currentIdx >= 0 && currentIdx < allAssignments.length - 1 ? allAssignments[currentIdx + 1] : null;
  const liveWeightedScore = calculateWeightedScore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/judge" className="hover:text-slate-900 transition-colors">Judging Portal</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-xs">{project.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Rubric Evaluation & Review
          </h1>
        </div>

        {/* Navigation between assigned projects */}
        <div className="flex items-center gap-2">
          {prevProjectId && (
            <Link to={`/judge/projects/${prevProjectId}`}>
              <Button variant="outline" size="sm">← Prev Project</Button>
            </Link>
          )}
          {nextProjectId && (
            <Link to={`/judge/projects/${nextProjectId}`}>
              <Button variant="outline" size="sm">Next Project →</Button>
            </Link>
          )}
          <Link to="/judge">
            <Button variant="ghost" size="sm">Console</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 Cols): Project Information for review */}
        <div className="lg:col-span-7 space-y-6">
          {/* Project Summary Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{project.trackName}</span>
              <StatusBadge status={project.status} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{project.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm">
                    Open Demo ↗
                  </Button>
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Inspect Repository ↗
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Problem Statement */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Problem Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {project.problem || project.description}
            </p>
          </div>

          {/* Solution & Architecture */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Solution & Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {project.solution || project.description}
            </p>
          </div>

          {/* Key Capabilities */}
          {project.features && project.features.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Claimed Capabilities & Benchmarks
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {project.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stack & Team */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Tech Stack
              </span>
              <div className="flex flex-wrap gap-1">
                {project.technologies.map(t => (
                  <span key={t} className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Team ({project.teamName})
              </span>
              <div className="text-xs text-slate-600 space-y-1">
                {project.teamMembers.map(m => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="text-slate-400 text-[11px]">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Dynamic Rubric Evaluation Form */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Evaluation Form
                </span>
                <h3 className="text-base font-bold text-slate-900">Official Rubric</h3>
              </div>

              {/* Live Preview Score Display */}
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Weighted Score</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {liveWeightedScore.toFixed(2)}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ 10</span>
                </span>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-6">
              {rubric.criteria.map(crit => {
                const currentScore = scores[crit.id]?.score ?? 8.0;
                const currentComments = scores[crit.id]?.comments ?? '';

                return (
                  <div key={crit.id} className="p-4 rounded-md border border-slate-100 bg-slate-50/70 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{crit.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{crit.description}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-600 shrink-0 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {crit.weight}%
                      </span>
                    </div>

                    {/* Numeric Score Selector (1 - 10) */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1.5">
                        <span>Score Allocation</span>
                        <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {currentScore.toFixed(1)} / {crit.maxScore}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={currentScore}
                        onChange={e => handleScoreChange(crit.id, parseFloat(e.target.value))}
                        disabled={isSubmitted}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>

                    {/* Comments on this criterion */}
                    <Textarea
                      placeholder={`Notes on ${crit.name.toLowerCase()}...`}
                      value={currentComments}
                      onChange={e => handleCommentsChange(crit.id, e.target.value)}
                      disabled={isSubmitted}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Overall Qualitative Feedback */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Textarea
                label="Overall Qualitative Feedback"
                placeholder="Key strengths, architectural reservations, or suggestions for production scaling..."
                value={overallFeedback}
                onChange={e => setOverallFeedback(e.target.value)}
                disabled={isSubmitted}
                className="text-xs min-h-[90px]"
              />
            </div>

            {/* Evaluation Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                isLoading={isSaving}
                disabled={isSubmitted}
              >
                Save Draft
              </Button>

              {!isSubmitted ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSave(true)}
                  isLoading={isSaving}
                >
                  Submit Evaluation
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-700 font-semibold">
                    ✓ Evaluation Finalized
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs text-slate-400 hover:text-slate-800"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
