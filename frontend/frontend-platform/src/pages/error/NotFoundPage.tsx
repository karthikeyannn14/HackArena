import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-lg border border-slate-200 bg-white p-8 shadow-xs">
        <span className="text-xs font-mono text-slate-400 block mb-1">HTTP 404</span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested route does not exist or has been moved. Check the URL or return to the platform homepage.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm">
              Back to Home
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="sm">
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
