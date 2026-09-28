import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Role } from '../../types';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('participant');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const u = await register(name, email, role);
      showToast('Registration successful', `Welcome to HackArena, ${u.name}!`, 'success');
      if (role === 'judge') navigate('/judge');
      else if (role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Join the community of competitive software engineers and organizers
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Elena Rostova"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            label="Email address"
            type="email"
            placeholder="elena@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Select
            label="Primary Role"
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            options={[
              { value: 'participant', label: 'Participant (Competitor / Hacker)' },
              { value: 'judge', label: 'Judge (Reviewer / Evaluator)' },
              { value: 'organizer', label: 'Organizer (Event Administrator)' },
            ]}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

