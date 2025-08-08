import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utlis/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'employee';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const user = getUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return <>{children}</>;
}