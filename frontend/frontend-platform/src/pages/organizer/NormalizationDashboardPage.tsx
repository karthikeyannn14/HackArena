import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NormalizationResult, ProjectAggregationResult, Event } from '../../types';
import { normalizationApi } from '../../services/api/normalization.api';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';

export const NormalizationDashboardPage: React.FC = () => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = paramEventId || 'evt_nexus_2026';

  const [event, setEvent] = useState<Event | null>(null);
  const [normalizationResults, setNormalizationResults] = useState<NormalizationResult[]>([]);
  const [projectAggregations, setProjectAggregations] = useState<ProjectAggregationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [ev, normResults, projAggs] = await Promise.all([
          eventsApi.getEvent(eventId),
          normalizationApi.getNormalizationResults(eventId),
          normalizationApi.getProjectAggregations(eventId),
        ]);
        setEvent(ev);
        setNormalizationResults(normResults);
        setProjectAggregations(projAggs);
      } catch (err) {
        console.error('Failed to load normalization dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleRunNormalization = async () => {
    setIsRunning(true);
    try {
      const res = await normalizationApi.triggerNormalizationRun(eventId);
      showToast('Normalization Succeeded', res.message, 'success');
      const [normResults, projAggs] = await Promise.all([
        normalizationApi.getNormalizationResults(eventId),
        normalizationApi.getProjectAggregations(eventId),
      ]);
      setNormalizationResults(normResults);
      setProjectAggregations(projAggs);
    } catch {
      showToast('Error', 'Failed to execute normalization run', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMALIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            NORMALIZED
          </span>
        );
      case 'INSUFFICIENT_SAMPLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            INSUFFICIENT_SAMPLE
          </span>
        );
      case 'ZERO_VARIANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            ZERO_VARIANCE
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
            UNAVAILABLE
          </span>
        );
    }
  };

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
              <span className="text-slate-900 font-medium">Statistical Normalization</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Normalization & Results Aggregation</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              All statistical distributions, Z-scores, and Bayesian aggregations are calculated by the backend engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunNormalization}
              isLoading={isRunning}
            >
              Trigger Normalization Run
            </Button>
          </div>
        </div>

        {/* Statistical Architecture Contract Notice */}
        <div className="bg-slate-900 text-white rounded-lg p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-100">
              Authoritative Backend Computation Contract
            </span>
            <span className="text-slate-400 hidden md:inline">
              · Z-score transforms, standard deviations, and project consensus aggregations are immutable backend records.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            No Client-Side Math
          </span>
        </div>

        {/* Section 1: Project Aggregation Results Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Project Consensus Aggregations</h2>
              <p className="text-xs text-slate-500">Cross-judge standardized scores and leaderboard ranks.</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{projectAggregations.length} Projects Analyzed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Usable Evals</th>
                  <th className="py-3 px-4">Aggregation Status</th>
                  <th className="py-3 px-4 text-right">Normalized Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectAggregations.map(p => (
                  <tr key={p.projectId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.rank ? `#0${p.rank}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link to={`/projects/${p.projectId}`} className="hover:underline">
                        {p.projectTitle}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.teamName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {p.trackName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">
                      {p.usableEvaluationsCount} / {p.totalEvaluationsCount} usable
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
                        p.aggregationStatus === 'AGGREGATED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {p.aggregationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                      {p.normalizedProjectScore !== null ? (
                        <span className="text-slate-900">
                          {p.normalizedProjectScore > 0 ? `+${p.normalizedProjectScore}` : p.normalizedProjectScore} <span className="text-[11px] text-slate-400 font-normal">Z</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Insufficient Data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Individual Evaluation Normalizations Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Individual Evaluation Normalizations</h2>
              <p className="text-xs text-slate-500">Judge-level standard deviations and standardized residuals.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Judge</th>
                  <th className="py-3 px-4">Raw Score</th>
                  <th className="py-3 px-4">Judge Sample</th>
                  <th className="py-3 px-4">Judge Mean (μ)</th>
                  <th className="py-3 px-4">Judge StdDev (σ)</th>
                  <th className="py-3 px-4">Normalization Status</th>
                  <th className="py-3 px-4 text-right">Normalized Z-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizationResults.map(r => (
                  <tr key={r.evaluationId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.projectTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {r.judgeName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {r.rawScore} / 100
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      N = {r.judgeSampleSize}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {r.judgeMean !== null ? r.judgeMean : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {r.judgeStdDev !== null ? r.judgeStdDev : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(r.normalizationStatus)}
                      {r.normalizationStatus === 'INSUFFICIENT_SAMPLE' && (
                        <p className="text-[10px] text-amber-700 mt-1">Not enough evaluation data to normalize this result.</p>
                      )}
                      {r.normalizationStatus === 'ZERO_VARIANCE' && (
                        <p className="text-[10px] text-purple-700 mt-1">Normalization unavailable because the judge scores have zero variance.</p>
                      )}
                      {r.normalizationStatus === 'UNAVAILABLE' && (
                        <p className="text-[10px] text-slate-500 mt-1">Normalized result is currently unavailable.</p>
                      )}
                      {r.normalizationStatus === 'FAILED' && (
                        <p className="text-[10px] text-rose-700 mt-1">Normalization failed. Please review the backend result or retry.</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                      {r.normalizedValue !== null ? (
                        <span className="text-slate-900">
                          {r.normalizedValue > 0 ? `+${r.normalizedValue}` : r.normalizedValue}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">null</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
