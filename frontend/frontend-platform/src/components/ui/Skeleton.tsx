import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
    <div className="h-32 bg-slate-100 rounded-md animate-pulse" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-1/2" />
    <div className="pt-2 flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);
