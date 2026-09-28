import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RubricDefinition, RubricVersion, RubricVersionCriterion, Event } from '../../types';
import { rubricsApi } from '../../services/api/rubrics.api';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export const RubricManagementPage: React.FC = () => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = paramEventId || 'evt_nexus_2026';

  const [event, setEvent] = useState<Event | null>(null);
  const [rubricDef, setRubricDef] = useState<RubricDefinition | null>(null);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(true);

  // New Version Modal
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // New Criterion Modal for Draft
  const [isAddCriterionModalOpen, setIsAddCriterionModalOpen] = useState(false);
  const [critName, setCritName] = useState('');
  const [critDesc, setCritDesc] = useState('');
  const [critWeight, setCritWeight] = useState(25);
  const [critMaxScore, setCritMaxScore] = useState(10);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [ev, rbc] = await Promise.all([
          eventsApi.getEvent(eventId),
          rubricsApi.getRubric(eventId),
        ]);
        setEvent(ev);
        setRubricDef(rbc);
        if (rbc) {
          setSelectedVersionNum(rbc.activeVersion);
        }
      } catch (err) {
        console.error('Failed to load rubric:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const currentVersion: RubricVersion | undefined = rubricDef?.versions.find(
    v => v.version === selectedVersionNum
  );

  const isPublished = currentVersion?.status === 'PUBLISHED';

  const handlePublishVersion = async () => {
    if (!currentVersion || isPublished) return;
    if (!window.confirm(`Are you sure you want to PUBLISH Version ${currentVersion.version}? Once published, it will be permanently locked and made authoritative for evaluations.`)) return;

    setIsPublishing(true);
    try {
      const updated = await rubricsApi.publishRubricVersion(eventId, currentVersion.version, 'Sarah Chen (Lead Organizer)');
      setRubricDef(updated);
      showToast('Rubric Published', `Version ${currentVersion.version} is now authoritative and locked.`, 'success');
    } catch {
      showToast('Error', 'Failed to publish rubric version', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateDraftVersion = async () => {
    if (!currentVersion) return;
    try {
      const clonedCriteria: RubricVersionCriterion[] = currentVersion.criteria.map(c => ({ ...c }));
      const updated = await rubricsApi.createRubricVersion(eventId, clonedCriteria, newVersionNotes);
      setRubricDef(updated);
      setSelectedVersionNum(Math.max(...updated.versions.map(v => v.version)));
      setIsNewVersionModalOpen(false);
      setNewVersionNotes('');
      showToast('Draft Version Created', 'You can now configure criteria in this draft.', 'info');
    } catch {
      showToast('Error', 'Failed to create draft version', 'error');
    }
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersion || isPublished) return;

    const newCriterion: RubricVersionCriterion = {
      id: `crt_${Date.now()}`,
      name: critName,
      description: critDesc,
      weight: Number(critWeight),
      maxScore: Number(critMaxScore),
    };

    currentVersion.criteria.push(newCriterion);
    setRubricDef({ ...rubricDef! });
    setIsAddCriterionModalOpen(false);
    setCritName('');
    setCritDesc('');
    showToast('Criterion Added', `${critName} added to draft version.`, 'success');
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!rubricDef || !currentVersion) {
    return (
      <div className="flex-1 p-8 text-center">
        <EmptyState title="No Rubric Configured" description="Could not find rubric configuration for this event." />
      </div>
    );
  }

  const totalWeight = currentVersion.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/organizer" className="hover:text-slate-900">Organizer</Link>
              <span>/</span>
              <Link to={`/organizer/events/${eventId}`} className="hover:text-slate-900 font-mono text-[11px]">{eventId}</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Rubric Builder</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{rubricDef.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-version scoring schema. Published versions are locked and authoritative for judges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewVersionModalOpen(true)}>
              Fork New Version +
            </Button>
            {!isPublished && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublishVersion}
                isLoading={isPublishing}
                disabled={totalWeight !== 100}
              >
                Publish Version {currentVersion.version}
              </Button>
            )}
          </div>
        </div>

        {/* Version Switcher Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
              Rubric Versions:
            </span>
            {rubricDef.versions.map(v => (
              <button
                key={v.version}
                type="button"
                onClick={() => setSelectedVersionNum(v.version)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  selectedVersionNum === v.version
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Version {v.version}</span>
                <span className={`text-[10px] px-1 rounded uppercase font-semibold ${
                  v.status === 'PUBLISHED'
                    ? selectedVersionNum === v.version ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : selectedVersionNum === v.version ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}>
                  {v.status}
                </span>
                {v.version === rubricDef.activeVersion && (
                  <span className="text-[10px] text-emerald-400 font-bold">★ Active</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Criteria Count: <strong className="text-slate-900 font-mono">{currentVersion.criteria.length}</strong></span>
            <span className="text-slate-500">Total Weight: <strong className={`font-mono ${totalWeight === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>{totalWeight}%</strong></span>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isPublished ? (
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-900">
                Version {currentVersion.version} is Published & Locked
              </span>
              <span className="text-slate-500">
                · Published by {currentVersion.publishedBy} on {currentVersion.publishedAt?.split('T')[0]}
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Read-Only Immutable Mode
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-bold text-amber-900">
                Version {currentVersion.version} is in Working Draft State
              </span>
              <span className="text-amber-700">
                · You can add or modify criteria. Ensure total weights sum to 100% before publishing.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAddCriterionModalOpen(true)} className="text-xs">
              Add Criterion +
            </Button>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-4">
          {currentVersion.criteria.map((c, idx) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">0{idx + 1}.</span>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{c.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Weight</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{c.weight}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Scale</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">0 - {c.maxScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Criterion Modal for Draft */}
        <Modal
          isOpen={isAddCriterionModalOpen}
          onClose={() => setIsAddCriterionModalOpen(false)}
          title={`Add Criterion to Version ${currentVersion.version} (Draft)`}
        >
          <form onSubmit={handleAddCriterion} className="space-y-4">
            <Input
              label="Criterion Name"
              placeholder="e.g. Scalability & Fault Tolerance"
              value={critName}
              onChange={e => setCritName(e.target.value)}
              required
            />

            <Textarea
              label="Evaluation Description & Rubric Guidance"
              placeholder="Explain how judges should score this criterion and what constitutes maximum points..."
              rows={3}
              value={critDesc}
              onChange={e => setCritDesc(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Weight Percentage (%)"
                type="number"
                min="1"
                max="100"
                value={critWeight}
                onChange={e => setCritWeight(Number(e.target.value))}
                required
              />
              <Input
                label="Max Score"
                type="number"
                min="1"
                max="100"
                value={critMaxScore}
                onChange={e => setCritMaxScore(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddCriterionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Criterion
              </Button>
            </div>
          </form>
        </Modal>

        {/* Fork New Version Modal */}
        <Modal
          isOpen={isNewVersionModalOpen}
          onClose={() => setIsNewVersionModalOpen(false)}
          title="Fork New Rubric Version"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              This will create a new mutable Draft version cloning all criteria from Version {currentVersion.version}. Active judging will continue against Version {rubricDef.activeVersion} until the new version is explicitly published.
            </p>

            <Textarea
              label="Change Notes (Audit Record)"
              placeholder="Describe the motivation for this revision: e.g. updated weighting for edge computing..."
              rows={3}
              value={newVersionNotes}
              onChange={e => setNewVersionNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsNewVersionModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateDraftVersion}>
                Create Draft Version
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
