import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  className = '',
  size = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono tabular-nums text-slate-500">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className="bg-slate-900 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
