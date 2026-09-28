import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reset your password</h1>
          <p className="text-xs text-slate-500 mt-1">
            We will send a secure verification token to your registered email
          </p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs font-semibold text-emerald-900">Check your inbox</p>
            <p className="text-xs text-emerald-700 mt-1">
              Instructions have been dispatched to <strong>{email}</strong>.
            </p>
            <div className="mt-4">
              <Link to="/login">
                <Button variant="outline" size="sm">Back to Sign In</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="engineer@devpulse.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
              Send Recovery Link
            </Button>
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-900">
                Cancel and return to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


