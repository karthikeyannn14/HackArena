import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, role, logout, switchRole, notifications, markNotificationsRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRoleSwitch = async (targetRole: Role) => {
    setRoleMenuOpen(false);
    await switchRole(targetRole);
    if (targetRole === 'admin') navigate('/admin');
    else if (targetRole === 'organizer') navigate('/organizer');
    else if (targetRole === 'judge') navigate('/judge');
    else if (targetRole === 'participant') navigate('/participant');
    else navigate('/');
  };

  // Nav links based on role
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Overview', href: '/admin' },
        { label: 'Events', href: '/admin/events' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Teams', href: '/admin/teams' },
        { label: 'Projects', href: '/admin/projects' },
        { label: 'Submissions', href: '/admin/submissions' },
      ];
    }
    if (role === 'participant') {
      return [
        { label: 'Dashboard', href: '/participant' },
        { label: 'My Team', href: '/participant/team' },
        { label: 'My Project', href: '/participant/project' },
        { label: 'Submissions', href: '/participant/submission' },
        { label: 'Events', href: '/events' },
      ];
    }
    if (role === 'judge') {
      return [
        { label: 'Dashboard', href: '/judge' },
        { label: 'Competitions', href: '/judge/events' },
        { label: 'Submissions', href: '/judge/events/evt_nexus_2026/submissions' },
        { label: 'Events Hub', href: '/events' },
      ];
    }
    if (role === 'organizer') {
      return [
        { label: 'Dashboard', href: '/organizer' },
        { label: 'Events', href: '/organizer/events' },
        { label: 'Conflicts', href: '/organizer/conflicts' },
        { label: 'Assignments', href: '/organizer/assignments' },
        { label: 'Rubrics', href: '/organizer/rubrics' },
        { label: 'Normalization', href: '/organizer/normalization' },
        { label: 'Audit', href: '/organizer/audit' },
      ];
    }
    return [
      { label: 'Events', href: '/events' },
      { label: 'Projects', href: '/events/evt_nexus_2026/projects' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'FAQ', href: '/#faq' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white text-xs font-mono font-bold">
                D
              </span>
              <span>HackArena</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Judging Engine Active
            </span>
          </div>

          {/* Zone 2: Desktop 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            {navLinks.map(link => {
              const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href) && !link.href.includes('#'));
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`transition-colors hover:text-slate-900 ${
                    isActive ? 'text-slate-900 font-semibold' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Zone 3: Actions & Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role Switcher Selector for fast evaluation */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 cursor-pointer"
                  title="Switch Role Mode"
                >
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">Role:</span>
                  <span className="font-semibold capitalize text-slate-900">{role}</span>
                  <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role Mode
                    </div>
                    <button
                      onClick={() => handleRoleSwitch('participant')}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        role === 'participant' ? 'font-semibold text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      <span>Participant</span>
                      {role === 'participant' && <span className="text-emerald-600">âœ“</span>}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('judge')}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        role === 'judge' ? 'font-semibold text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      <span>Judge</span>
                      {role === 'judge' && <span className="text-emerald-600">âœ“</span>}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('organizer')}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        role === 'organizer' ? 'font-semibold text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      <span>Organizer</span>
                      {role === 'organizer' && <span className="text-emerald-600">âœ“</span>}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('admin')}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        role === 'admin' ? 'font-semibold text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      <span>Platform Admin</span>
                      {role === 'admin' && <span className="text-emerald-600">âœ“</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifMenuOpen(!notifMenuOpen);
                    if (!notifMenuOpen) markNotificationsRead();
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md relative cursor-pointer"
                  aria-label="Notifications"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>

                {notifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-900">Notifications</span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">{notifications.length} total</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto mt-1">
                      {notifications.map(n => (
                        <div key={n.id} className="py-2 text-left">
                          <p className="text-xs font-medium text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile / Logout */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link to="/profile" className="text-right group hover:opacity-85 transition-opacity">
                  <p className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-slate-700">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-slate-500 hover:text-slate-900">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">{user.email}</span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-600 font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

