import React from 'react';
import { EventStatus, ProjectStatus, EvaluationStatus } from '../../types';

interface StatusBadgeProps {
  status: EventStatus | ProjectStatus | EvaluationStatus | 'active' | 'invited' | 'winner' | 'runner_up' | 'finalist' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let label = status.replace(/_/g, ' ');
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-600';

  switch (status) {
    // Event statuses
    case 'live':
      label = 'Live Event';
      dotColor = 'bg-emerald-500 animate-pulse';
      textColor = 'text-emerald-700 font-medium';
      break;
    case 'registration_open':
      label = 'Registration Open';
      dotColor = 'bg-blue-500';
      textColor = 'text-blue-700 font-medium';
      break;
    case 'registration_closed':
      label = 'Registration Closed';
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-700';
      break;
    case 'upcoming':
      label = 'Upcoming';
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600';
      break;
    case 'completed':
      label = 'Completed';
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-500';
      break;

    // Project / Evaluation statuses
    case 'submitted':
      label = 'Submitted';
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-700 font-medium';
      break;
    case 'draft':
      label = 'Draft in Progress';
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-700';
      break;
    case 'in_progress':
      label = 'In Progress';
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-700 font-medium';
      break;
    case 'not_started':
      label = 'Not Started';
      dotColor = 'bg-slate-300';
      textColor = 'text-slate-500';
      break;
    case 'winner':
      label = 'Grand Winner';
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800 font-semibold';
      break;
    case 'runner_up':
      label = 'Runner Up';
      dotColor = 'bg-slate-700';
      textColor = 'text-slate-800 font-medium';
      break;
    case 'finalist':
      label = 'Finalist';
      dotColor = 'bg-blue-500';
      textColor = 'text-blue-700 font-medium';
      break;
    case 'active':
      label = 'Active';
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-700';
      break;
    case 'invited':
      label = 'Invite Pending';
      dotColor = 'bg-amber-400';
      textColor = 'text-amber-700';
      break;
    default:
      label = status.charAt(0).toUpperCase() + status.slice(1);
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
      <span className="capitalize">{label}</span>
    </span>
  );
};
