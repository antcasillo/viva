import { Navigate, useLocation } from 'react-router-dom';
import { useRequireRole } from '../context/AuthContext';
import type { UserRole } from '../types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, hasAccess, isAuthenticated } = useRequireRole(allowedRoles);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    // Utente loggato ma ruolo non autorizzato -> redirect alla sua area
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/area-utente" replace />;
  }

  return <>{children}</>;
}
