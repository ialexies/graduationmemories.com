import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/admin/content" replace />;
  }

  return <>{children}</>;
}
