import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-900 flex items-center justify-center text-white text-[10px] font-mono font-bold">
                D
              </span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">HackArena</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
              Open infrastructure for competitive hackathon administration, structured rubric evaluations, and verifiable project discovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <Link to="/events" className="hover:text-slate-900 transition-colors">
              Browse Events
            </Link>
            <Link to="/events/evt_nexus_2026/projects" className="hover:text-slate-900 transition-colors">
              Project Index
            </Link>
            <Link to="/#rules" className="hover:text-slate-900 transition-colors">
              Code of Conduct
            </Link>
            <Link to="/#api" className="hover:text-slate-900 transition-colors">
              Judging Rubrics
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>Â© {new Date().getFullYear()} HackArena Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span>Production v1.0.4</span>
            <span aria-hidden="true">Â·</span>
            <span>Status: Nominal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

