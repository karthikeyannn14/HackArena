import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  const { role, switchRole } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-lg border border-slate-200 bg-white p-8 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span className="text-xs font-mono text-slate-400 block mb-1">HTTP 403</span>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Access Restricted</h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          You are currently signed in as <strong className="font-semibold text-slate-800 capitalize">{role}</strong>. This section requires different administrative privileges.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-[11px] text-slate-400 mb-1">Quick switch test roles:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => switchRole('participant')}>
              Participant
            </Button>
            <Button variant="outline" size="sm" onClick={() => switchRole('judge')}>
              Judge
            </Button>
            <Button variant="outline" size="sm" onClick={() => switchRole('organizer')}>
              Organizer
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
            <Link to="/">
              <Button variant="ghost" size="sm">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
