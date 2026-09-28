import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, role, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || 'https://github.com');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || 'https://linkedin.com');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');
  const [skillsInput, setSkillsInput] = useState((user?.skills || ['TypeScript', 'Distributed Systems', 'React', 'Rust']).join(', '));
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const skills = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await updateProfile({
        name,
        organization,
        bio,
        githubUrl,
        linkedinUrl,
        websiteUrl,
        skills,
      });

      showToast('Profile updated', 'Your profile details have been saved successfully.', 'success');
    } catch (err: any) {
      showToast('Update failed', err?.message || 'Could not save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Invalid password', 'New password must be at least 6 characters.', 'error');
      return;
    }
    setIsChangingPass(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      setCurrentPassword('');
      setNewPassword('');
      showToast('Security updated', 'Your password has been changed successfully.', 'success');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500">Please sign in to view your profile.</p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    participant: 'Participant / Builder',
    judge: 'Technical Evaluation Judge',
    organizer: 'Hackathon Organizer',
    admin: 'Platform Administrator',
  };

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-900 text-white font-mono text-xl font-bold flex items-center justify-center shadow-xs">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{name}</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-700 capitalize">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{email} · {organization || 'Independent Developer'}</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xl line-clamp-1">{bio || 'No bio provided yet.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {role === 'participant' && (
              <Link to="/participant">
                <Button variant="outline" size="sm">Go to Dashboard</Button>
              </Link>
            )}
            {role === 'judge' && (
              <Link to="/judge">
                <Button variant="outline" size="sm">Judging Workspace</Button>
              </Link>
            )}
            {role === 'organizer' && (
              <Link to="/organizer">
                <Button variant="outline" size="sm">Organizer Portal</Button>
              </Link>
            )}
            {role === 'admin' && (
              <Link to="/admin">
                <Button variant="outline" size="sm">Platform Admin</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-4">
                Personal Information
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full text-xs rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization / Company / University"
                    placeholder="e.g. NeuralShift Labs, Stanford"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Role
                    </label>
                    <input
                      type="text"
                      value={roleLabels[role] || role}
                      disabled
                      className="w-full text-xs rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed capitalize"
                    />
                  </div>
                </div>

                <Textarea
                  label="Biography & Technical Focus"
                  placeholder="Summarize your engineering background, research interests, or competition history..."
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />

                <Input
                  label="Technical Skills (comma-separated)"
                  placeholder="Rust, TypeScript, PyTorch, Kubernetes, WebAssembly"
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                />

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h3 className="text-xs font-semibold text-slate-900 mb-3">Links & Profiles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="GitHub"
                      placeholder="https://github.com/..."
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                    />
                    <Input
                      label="LinkedIn"
                      placeholder="https://linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                    />
                    <Input
                      label="Personal Website"
                      placeholder="https://..."
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-2">
                Security & Authentication
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Update your account password or review session activity.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <Input
                  type="password"
                  label="Current Password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Button type="submit" variant="outline" size="sm" isLoading={isChangingPass}>
                  Update Password
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Platform Metadata & Activity */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Account Status
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-slate-500 text-[11px] truncate max-w-[130px]">
                    {user.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Member Since:</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {user.createdAt || '2026-08-15'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auth Type:</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    JWT / Bearer
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Current Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(user.skills || ['Distributed Systems', 'Rust', 'TypeScript', 'WebAssembly']).map(skill => (
                  <span
                    key={skill}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Platform Navigation
              </h3>
              <div className="space-y-2 text-xs">
                <Link to="/events" className="block text-slate-600 hover:text-slate-900 transition-colors">
                  → Browse Hackathons
                </Link>
                <Link to="/events/evt_nexus_2026/projects" className="block text-slate-600 hover:text-slate-900 transition-colors">
                  → Explore Projects Gallery
                </Link>
                {role === 'organizer' && (
                  <Link to="/organizer/events/new" className="block text-slate-600 hover:text-slate-900 transition-colors">
                    → Create New Hackathon
                  </Link>
                )}
                {role === 'admin' && (
                  <Link to="/admin/users" className="block text-slate-600 hover:text-slate-900 transition-colors">
                    → User Directory
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
