import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuditLogEntry, AuditLogAction, Event } from '../../types';
import { auditApi } from '../../services/api/audit.api';
import { eventsApi } from '../../api/events';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export const AuditLogPage: React.FC = () => {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = paramEventId || 'evt_nexus_2026';

  const [event, setEvent] = useState<Event | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditLogAction | 'all'>('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [ev, allLogs] = await Promise.all([
          eventsApi.getEvent(eventId),
          auditApi.getAuditLogs({ eventId }),
        ]);
        setEvent(ev);
        setLogs(allLogs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.actor.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q);

    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || l.entity === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Actor Role', 'Action', 'Entity', 'Entity ID', 'Metadata'];
    const rows = filtered.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor}"`,
      l.actorRole,
      l.action,
      l.entity,
      l.entityId,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${eventId}_audit_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Exported chronological audit trail as CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const getActionColor = (action: AuditLogAction) => {
    if (action.includes('REOPENED') || action.includes('BLOCKED') || action.includes('REMOVED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('CONFLICT') || action.includes('SUSPENDED')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (action.includes('PUBLISHED') || action.includes('SUBMITTED') || action.includes('ACCEPTED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
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
              <span className="text-slate-900 font-medium">Compliance Audit</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Event Lineage</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only historical stream. Chronological sequencing is authoritative from backend storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              Export Audit CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input
            placeholder="Search by actor, entity ID, or keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Actions', value: 'all' },
              { label: 'EVALUATION_REOPENED', value: 'EVALUATION_REOPENED' },
              { label: 'EVALUATION_SUBMITTED', value: 'EVALUATION_SUBMITTED' },
              { label: 'ASSIGNMENT_RUN_CREATED', value: 'ASSIGNMENT_RUN_CREATED' },
              { label: 'ASSIGNMENT_REPLACED', value: 'ASSIGNMENT_REPLACED' },
              { label: 'JUDGE_CONFLICT_DECLARED', value: 'JUDGE_CONFLICT_DECLARED' },
              { label: 'RUBRIC_VERSION_PUBLISHED', value: 'RUBRIC_VERSION_PUBLISHED' },
            ]}
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as any)}
          />

          <Select
            options={[
              { label: 'All Entities', value: 'all' },
              { label: 'Evaluation', value: 'Evaluation' },
              { label: 'Assignment', value: 'Assignment' },
              { label: 'AssignmentRun', value: 'AssignmentRun' },
              { label: 'JudgeConflict', value: 'JudgeConflict' },
              { label: 'RubricVersion', value: 'RubricVersion' },
            ]}
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No audit activity matches filters"
                description="Try clearing search or filter selections."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {l.timestamp.replace('T', ' ').replace('Z', '')}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {l.actor}
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">{l.actorRole}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${getActionColor(l.action)}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {l.entity}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {l.entityId}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(l)}
                          className="text-[11px]"
                        >
                          Inspect JSON →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metadata Modal */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Payload: ${selectedLog?.action}`}
        >
          <div className="space-y-3">
            <div className="text-xs space-y-1">
              <p><span className="text-slate-500">Log ID:</span> <strong className="font-mono text-slate-800">{selectedLog?.id}</strong></p>
              <p><span className="text-slate-500">Timestamp:</span> <strong className="font-mono text-slate-800">{selectedLog?.timestamp}</strong></p>
              <p><span className="text-slate-500">Actor:</span> <strong className="text-slate-800">{selectedLog?.actor} ({selectedLog?.actorRole})</strong></p>
              <p><span className="text-slate-500">Target Entity:</span> <strong className="font-mono text-slate-800">{selectedLog?.entity} / {selectedLog?.entityId}</strong></p>
            </div>

            <div className="border-t border-slate-100 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Metadata Attributes
              </span>
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded font-mono overflow-x-auto max-h-56">
                {JSON.stringify(selectedLog?.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
