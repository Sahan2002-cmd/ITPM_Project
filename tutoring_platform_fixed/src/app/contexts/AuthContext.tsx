import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAction, registerAction, logoutAction } from '../actions/UserAction';
import { toast } from 'sonner';

// Define the exact shape of the user object returned by loginAction
interface LoginUser {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
  token: string;
  roleId?: number;
}

interface User {
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
  avatar: string;
  userId?: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (data: any) => Promise<{ success: boolean; errors?: any }>;
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
      if (user.token) localStorage.setItem('token', user.token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const result = await loginAction(email, password);
    if (result.success && result.user) {
      // Assert the shape of result.user
      const backendUser = result.user as LoginUser;
      const userData: User = {
        email: backendUser.email,
        name: backendUser.fullName,
        role: backendUser.roleName.toLowerCase() as 'student' | 'tutor' | 'admin',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.fullName}`,
        userId: backendUser.userId,
        token: backendUser.token,
      };
      setUser(userData);
      return { success: true, role: userData.role };
    }
    const errorMsg = (result.errors as any)?.general || 'Invalid credentials';
    return { success: false, error: errorMsg };
  };

  const register = async (formData: any) => {
    const result = await registerAction(formData);
    if (result.success) {
      toast.success('Account created! Please verify OTP sent to your email & phone.');
    }
    return result;
  };

  const logout = () => {
    logoutAction();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}