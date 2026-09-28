import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const u = await login(email, password);
      showToast('Welcome back', `Signed in as ${u.name}`, 'success');
      if (u.role === 'admin') navigate('/admin');
      else if (u.role === 'judge') navigate('/judge');
      else if (u.role === 'organizer') navigate('/organizer');
      else navigate(from.startsWith('/judge') || from.startsWith('/organizer') || from.startsWith('/admin') ? '/participant' : from);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (targetRole: Role, _demoEmail: string) => {
    setIsSubmitting(true);
    try {
      await switchRole(targetRole);
      showToast('Session switched', `Logged in as ${targetRole}`, 'info');
      if (targetRole === 'admin') navigate('/admin');
      else if (targetRole === 'judge') navigate('/judge');
      else if (targetRole === 'organizer') navigate('/organizer');
      else navigate('/participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white text-xs font-mono font-bold">
              D
            </span>
            <span className="text-base font-bold text-slate-900">HackArena</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your hackathons, team projects, and judging assignments
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="engineer@devpulse.io"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-slate-900">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        {/* Quick Demo Role Logins */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Instant Demo Logins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('participant', 'elena.rostova@devpulse.io')}
            >
              Participant
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('judge', 'marcus.vance@techvault.org')}
            >
              Judge
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('organizer', 'sarah.chen@globalhack.org')}
            >
              Organizer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('admin', 'admin@devpulse.io')}
            >
              Admin
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};


