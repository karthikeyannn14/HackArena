import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`rounded-lg border border-dashed border-slate-300 bg-white/50 p-8 text-center max-w-md mx-auto my-8 ${className}`}>
      {icon ? (
        <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
          {icon}
        </div>
      ) : (
        <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
