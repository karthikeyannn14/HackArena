import { User, Role } from '../types';
import { db } from './storage';

export interface UserFilterOptions {
  role?: Role | 'all';
  search?: string;
  status?: 'active' | 'suspended' | 'all';
}

export const usersApi = {
  async getUsers(filters?: UserFilterOptions): Promise<User[]> {
    await new Promise(r => setTimeout(r, 200));
    let users = db.getUsers();

    if (filters?.role && filters.role !== 'all') {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters?.status && filters.status !== 'all') {
      users = users.filter(u => (u.status || 'active') === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.organization && u.organization.toLowerCase().includes(q))
      );
    }

    return users;
  },

  async getUser(id: string): Promise<User | null> {
    await new Promise(r => setTimeout(r, 100));
    const users = db.getUsers();
    return users.find(u => u.id === id) || null;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await new Promise(r => setTimeout(r, 250));
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User ${id} not found`);
    }

    const updated = {
      ...users[index],
      ...updates,
    };
    users[index] = updated;
    db.setUsers([...users]);

    // If current logged-in user, sync with storage
    const currentRaw = localStorage.getItem('devpulse_current_user');
    if (currentRaw) {
      try {
        const current = JSON.parse(currentRaw);
        if (current.id === id) {
          localStorage.setItem('devpulse_current_user', JSON.stringify(updated));
        }
      } catch {}
    }

    return updated;
  },

  async changeUserRole(id: string, newRole: Role): Promise<User> {
    return this.updateUser(id, { role: newRole });
  },

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');
    const newStatus = (user.status || 'active') === 'active' ? 'suspended' : 'active';
    return this.updateUser(id, { status: newStatus });
  },

  async deleteUser(id: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 200));
    const users = db.getUsers();
    const filtered = users.filter(u => u.id !== id);
    db.setUsers(filtered);
    return true;
  }
};


