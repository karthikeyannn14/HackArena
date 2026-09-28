import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Role } from '../../types';
import { usersApi } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role>('participant');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const list = await usersApi.getUsers();
        setUsers(list);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenRoleModal = (u: User) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setIsModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      const updated = await usersApi.changeUserRole(selectedUser.id, newRole);
      setUsers(prev => prev.map(u => (u.id === selectedUser.id ? updated : u)));
      showToast('Role updated', `User ${selectedUser.name} is now ${newRole}`, 'success');
      setIsModalOpen(false);
    } catch {
      showToast('Error', 'Failed to update role', 'error');
    }
  };

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const updated = await usersApi.toggleUserStatus(id);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
      showToast('Status updated', `${name} is now ${updated.status || 'active'}`, 'info');
    } catch {
      showToast('Error', 'Failed to toggle status', 'error');
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.organization && u.organization.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin" className="hover:text-slate-900">Admin</Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">User Directory</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Governance & Access</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage permissions, audit registered accounts, delegate administrative roles, and enforce platform policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
              Total Accounts: {users.length}
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[
                { label: 'All Roles', value: 'all' },
                { label: 'Participants', value: 'participant' },
                { label: 'Judges', value: 'judge' },
                { label: 'Organizers', value: 'organizer' },
                { label: 'Platform Admins', value: 'admin' },
              ]}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No users match your query"
                description="Try clearing search filters or invite new users."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(u => {
                    const status = u.status || 'active';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded bg-slate-800 text-white font-mono flex items-center justify-center text-xs font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div>{u.name}</div>
                              <div className="text-[11px] font-normal text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'organizer'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : u.role === 'judge'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {u.organization || 'Independent Developer'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {u.createdAt || '2026-08-15'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRoleModal(u)}
                            className="text-[11px]"
                          >
                            Change Role
                          </Button>
                          <Button
                            variant={status === 'active' ? 'ghost' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleStatus(u.id, u.name)}
                            className={`text-[11px] ${status === 'active' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600'}`}
                          >
                            {status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Role Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Assign Platform Role: ${selectedUser?.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Modifying this role will grant or restrict system permissions immediately.
            </p>

            <Select
              label="Select Target Role"
              options={[
                { label: 'Participant (Default Builder)', value: 'participant' },
                { label: 'Judge (Evaluation Workspace Access)', value: 'judge' },
                { label: 'Organizer (Event Command Operations)', value: 'organizer' },
                { label: 'Platform Admin (Full Governance)', value: 'admin' },
              ]}
              value={newRole}
              onChange={e => setNewRole(e.target.value as Role)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveRole}>
                Apply Role Update
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
