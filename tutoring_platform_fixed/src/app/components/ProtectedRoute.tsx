import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'tutor' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Not logged in → go to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Tutors whose account is still pending admin approval can only see the waiting page
  if (user.role === 'tutor' && user.status === 'PendingApproval') {
    if (location.pathname !== '/tutor/pending-approval') {
      return <Navigate to="/tutor/pending-approval" replace />;
    }
  }

  // Role check: if allowedRoles defined and user's role not in it → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
    if (user.role === 'tutor') return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
}
