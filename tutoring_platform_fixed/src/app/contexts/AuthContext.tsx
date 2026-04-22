import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/UserAPI';

interface User {
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
  avatar: string;
  userId?: number;
  status?: string;        // "Active" | "PendingApproval" | "Inactive" | "Suspended"
  approvedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string; status?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string; status?: string }> => {
    try {
      const data = await loginUser({ email, password });

      // Backend returns: { StatusCode, Data: { token, UserId, FullName, Email, RoleName, RoleId, Status, ApprovedAt }, Message }
      if (data.StatusCode !== 1) {
        return { success: false, error: data.Message || 'Invalid email or password' };
      }

      const { token, UserId, FullName, Email, RoleName, Status, ApprovedAt } = data.Data;
      const role = (RoleName as string).toLowerCase() as 'student' | 'tutor' | 'admin';

      localStorage.setItem('token', token);

      const loggedInUser: User = {
        email: Email,
        name: FullName,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${FullName}`,
        userId: UserId,
        status: Status,
        approvedAt: ApprovedAt ?? null,
      };
      setUser(loggedInUser);
      return { success: true, role, status: Status };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
