import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi } from '../../api/projects';
import { teamsApi } from '../../api/teams';
import { eventsApi } from '../../api/events';
import { Project, Event, Team } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

const STEPS = [
  { id: 1, title: 'Basic Information', desc: 'Title, tagline, challenge track' },
  { id: 2, title: 'Problem & Solution', desc: 'Engineering motivation & design' },
  { id: 3, title: 'Technologies & Features', desc: 'Stack components & capabilities' },
  { id: 4, title: 'Media & Repositories', desc: 'Demo URL, Git repo, walkthrough' },
  { id: 5, title: 'Review & Verify', desc: 'Pre-flight validation' },
];

export const ProjectBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [trackId, setTrackId] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [technologiesText, setTechnologiesText] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [demoUrl, setDemoUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

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
          if (prj) {
            setProjectId(prj.id);
            setTitle(prj.title);
            setTagline(prj.tagline);
            setTrackId(prj.trackId);
            setProblem(prj.problem);
            setSolution(prj.solution);
            setTechnologiesText(prj.technologies.join(', '));
            setFeatures(prj.features && prj.features.length > 0 ? prj.features : ['']);
            setDemoUrl(prj.demoUrl);
            setRepoUrl(prj.repoUrl);
            setVideoUrl(prj.videoUrl || '');
          } else if (activeEvt && activeEvt.tracks.length > 0) {
            setTrackId(activeEvt.tracks[0].id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const saveProject = async (proceedToNext = false) => {
    if (!event || !team) {
      showToast('Team required', 'You must establish a team before saving a project submission.', 'error');
      return null;
    }
    setIsSaving(true);
    try {
      const techArray = technologiesText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const filteredFeatures = features.map(f => f.trim()).filter(Boolean);

      const saved = await projectsApi.saveProjectDraft({
        id: projectId,
        eventId: event.id,
        teamId: team.id,
        title: title || 'Untitled Project',
        tagline,
        trackId: trackId || (event.tracks[0]?.id || 'trk_gen'),
        problem,
        solution,
        features: filteredFeatures,
        technologies: techArray,
        demoUrl,
        repoUrl,
        videoUrl,
      });

      setProjectId(saved.id);
      showToast('Draft Saved', 'Project state successfully synced.', 'success');

      if (proceedToNext && currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
      return saved;
    } catch (err: any) {
      showToast('Error saving draft', err?.message || 'Check network connection.', 'error');
      return null;
    } finally {
      setIsSaving(false);
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

  if (!team) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="text-lg font-bold text-slate-900">Create a Team First</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
            Project submissions are linked to teams. Please establish a team name and add collaborators before starting the builder.
          </p>
          <Link to="/dashboard/team">
            <Button variant="primary" size="md">
              Proceed to Team Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Project Builder â€” Step {currentStep} of {STEPS.length}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {STEPS[currentStep - 1].title}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {STEPS[currentStep - 1].desc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveProject(false)}
            isLoading={isSaving}
          >
            Save Draft
          </Button>
          {projectId && (
            <Link to={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm">
                Preview Public
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="my-6">
        <ProgressBar value={progressPercent} label="Submission Readiness" />
        <div className="mt-3 grid grid-cols-5 gap-2 text-center">
          {STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`text-[11px] font-medium transition-colors cursor-pointer ${
                s.id === currentStep
                  ? 'text-slate-900 font-semibold'
                  : s.id < currentStep
                  ? 'text-slate-600'
                  : 'text-slate-400'
              }`}
            >
              <span className="hidden sm:inline">{s.id}. </span>{s.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Step Panels */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <Input
              label="Project Title"
              placeholder="e.g. NeuralKV: Speculative Prefetch Cache"
              value={title}
              onChange={e => setTitle(e.target.value)}
              helperText="A clear, memorable name summarizing your system architecture."
              required
            />

            <Input
              label="One-line Tagline / Elevator Pitch"
              placeholder="e.g. Cuts token generation latency by 42% on memory-bound edge servers."
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              helperText="Max 140 characters explaining the quantitative outcome."
              required
            />

            {event && (
              <Select
                label="Target Challenge Track"
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                options={event.tracks.map(t => ({
                  value: t.id,
                  label: `${t.name} (${t.prizePool})`,
                }))}
                helperText="Select the track rubric against which your project will be scored."
              />
            )}
          </div>
        )}

        {/* Step 2: Problem & Solution */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <Textarea
              label="The Technical Problem"
              placeholder="Detail the performance bottleneck, architectural vulnerability, or systemic failure you are addressing..."
              value={problem}
              onChange={e => setProblem(e.target.value)}
              className="min-h-[140px]"
              helperText="Explain why existing tooling or naive implementations fall short."
              required
            />

            <Textarea
              label="Engineered Solution & Architectural Design"
              placeholder="Describe your design choices, concurrency model, data structures, and mathematical foundations..."
              value={solution}
              onChange={e => setSolution(e.target.value)}
              className="min-h-[160px]"
              helperText="Include algorithmic guarantees, caching policies, or protocol specifications."
              required
            />
          </div>
        )}

        {/* Step 3: Technologies & Features */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Input
              label="Technologies & Frameworks (comma separated)"
              placeholder="Rust, CUDA, Tokio, PyTorch, RocksDB, gRPC"
              value={technologiesText}
              onChange={e => setTechnologiesText(e.target.value)}
              helperText="List languages, compilers, storage engines, and key libraries used."
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Key Capabilities & Verified Benchmarks
                </label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs text-slate-800 hover:text-black font-semibold cursor-pointer"
                >
                  + Add Capability
                </button>
              </div>

              <div className="space-y-2.5">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
                      placeholder={`Feature ${idx + 1}: e.g. Sub-5Î¼s speculative lookup latency`}
                      value={feat}
                      onChange={e => handleFeatureChange(idx, e.target.value)}
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer text-xs"
                      >
                        âœ•
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media & External Links */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <Input
              label="Interactive Live Demo URL"
              type="url"
              placeholder="https://my-project.devpulse.app"
              value={demoUrl}
              onChange={e => setDemoUrl(e.target.value)}
              helperText="Hosted web application, WebAssembly runtime, or benchmark console."
              required
            />

            <Input
              label="Source Code Repository URL"
              type="url"
              placeholder="https://github.com/organization/project-repo"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              helperText="Public repository containing project code and reproduction guidelines."
              required
            />

            <Input
              label="Video Walkthrough / Architecture Tour (Optional)"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              helperText="2-3 minute screen recording demonstrating the running software."
            />
          </div>
        )}

        {/* Step 5: Review & Verify */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title || 'Untitled'}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{tagline || 'No tagline'}</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {event?.tracks.find(t => t.id === trackId)?.name || 'Track'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-700 space-y-2">
                <p><strong>Problem:</strong> {problem ? problem.slice(0, 160) + '...' : 'Not specified'}</p>
                <p><strong>Solution:</strong> {solution ? solution.slice(0, 160) + '...' : 'Not specified'}</p>
                <p><strong>Stack:</strong> {technologiesText || 'None'}</p>
                <p><strong>Demo:</strong> {demoUrl || 'None'}</p>
                <p><strong>Repo:</strong> {repoUrl || 'None'}</p>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <p className="font-semibold">Pre-Flight Review Notice</p>
              <p className="mt-1 leading-relaxed">
                Review your entry carefully. You will be redirected to the formal submission verification screen where you can lock your submission before the deadline.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            â† Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < STEPS.length ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => saveProject(true)}
                isLoading={isSaving}
              >
                Continue â†’
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const saved = await saveProject(false);
                  if (saved) {
                    navigate('/dashboard/submissions');
                  }
                }}
                isLoading={isSaving}
              >
                Proceed to Final Submission ðŸš€
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


