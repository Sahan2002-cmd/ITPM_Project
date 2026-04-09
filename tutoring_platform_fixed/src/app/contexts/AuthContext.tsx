import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Updated credentials
const CREDENTIALS = [
  { email: 'it23837676@my.sliit.lk', password: 'Student@123', name: 'Emma Thompson', role: 'student' as const },
  { email: 'randeer.p@sliit.lk', password: 'Tutor@123', name: 'Randeer Perera', role: 'tutor' as const },
  { email: 'gamage.admin@sliit.lk', password: 'Admin@123', name: 'Gamage Admin', role: 'admin' as const },
];

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
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const account = CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );

    if (account) {
      const loggedInUser: User = {
        email: account.email,
        name: account.name,
        role: account.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.name}`
      };
      setUser(loggedInUser);
      return { success: true, role: account.role };
    }

    return { success: false, error: 'Invalid email or password' };
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
