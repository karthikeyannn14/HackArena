import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, NotificationItem } from '../types';
import { authApi } from '../api/auth';
import { db } from '../api/storage';

interface AuthContextValue {
  user: User | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (name: string, email: string, role?: Role) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<User>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  notifications: NotificationItem[];
  markNotificationsRead: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function initAuth() {
      try {
        const u = await authApi.getCurrentUser();
        setUser(u);
        setNotifications(db.getNotifications());
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const u = await authApi.login(email, password);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: Role = 'participant') => {
    setIsLoading(true);
    try {
      const u = await authApi.register(name, email, role);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: Role) => {
    setIsLoading(true);
    try {
      const u = await authApi.switchRole(targetRole);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    setIsLoading(true);
    try {
      const u = await authApi.updateProfile(updates);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    db.setNotifications(updated);
  };

  const role: Role = user ? user.role : 'public';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        updateProfile,
        notifications,
        markNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
