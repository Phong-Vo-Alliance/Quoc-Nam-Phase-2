import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  redirectTo?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Setup automatic token refresh for authenticated users
  useTokenRefresh();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
