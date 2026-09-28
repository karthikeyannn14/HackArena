import { User, Role } from '../types';
import { db } from './storage';
import { setAuthToken } from '../services/api/client';

// Maps backend user shape (Member 1) â†’ frontend User type
function mapBackendUser(u: any): User {
  return {
    id: u._id?.toString() || u.id,
    name: u.name,
    email: u.email,
    role: (u.role?.toLowerCase() || 'participant') as Role,
    status: 'active',
    createdAt: u.createdAt,
  };
}

export const authApi = {
  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem('devpulse_current_user');
    if (raw) {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    // Try fetching from backend if we have a JWT
    const token = localStorage.getItem('devpulse_jwt_token');
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        localStorage.removeItem('devpulse_jwt_token');
        localStorage.removeItem('devpulse_current_user');
        return null;
      }
      const body = await res.json();
      const user = mapBackendUser(body.user || body);
      localStorage.setItem('devpulse_current_user', JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  async login(email: string, password?: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: password || '' }),
    });

    const body = await res.json();

    if (!res.ok) {
      throw new Error(body.message || 'Login failed');
    }

    // Backend returns { success, message, token, user }
    const { token, user: backendUser } = body;
    if (!token) throw new Error('Backend did not return a JWT');

    // Store the real server-issued JWT
    setAuthToken(token);

    const user = mapBackendUser(backendUser);
    localStorage.setItem('devpulse_current_user', JSON.stringify(user));
    return user;
  },

  async register(name: string, email: string, _role: Role = 'participant'): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: 'HackArena@2024!' }),
    });

    const body = await res.json();

    if (!res.ok) {
      throw new Error(body.message || 'Registration failed');
    }

    // Registration doesn't issue a JWT â€” prompt user to log in
    const user = mapBackendUser(body.user || body);
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('devpulse_current_user');
    setAuthToken(null);
  },

  // UI convenience â€” preserved from original, not security-relevant
  async switchRole(role: Role): Promise<User> {
    const users = db.getUsers();
    let target = users.find(u => u.role === role);
    if (!target) {
      target = {
        id: `usr_${role}_${Date.now()}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        email: `${role}@devpulse.io`,
        role,
        status: 'active',
      };
      db.setUsers([...users, target]);
    }
    localStorage.setItem('devpulse_current_user', JSON.stringify(target));
    return target;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const raw = localStorage.getItem('devpulse_current_user');
    if (!raw) throw new Error('Not authenticated');
    const current = JSON.parse(raw);
    const updated = { ...current, ...updates };
    localStorage.setItem('devpulse_current_user', JSON.stringify(updated));
    return updated;
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 300));
    return Boolean(email);
  }
};


