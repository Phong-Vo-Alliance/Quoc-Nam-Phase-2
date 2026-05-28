/**
 * PortalPage Component
 *
 * Main portal entry point - renders the chat portal wireframe
 * Handles authentication check and redirects
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_CONFIG } from '@/lib/auth/config';
import PortalWireframes from '@/features/portal/PortalWireframes';
import { AdminDemoFloatingButton } from '@/features/portal/components/AdminDemoFloatingButton';

/**
 * Portal page - main chat application entry point
 * Redirects to login if not authenticated
 */
export function PortalPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(AUTH_CONFIG.routes.login, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Don't render portal if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gray-50"
      data-testid="portal-page"
    >
      <PortalWireframes />
      <AdminDemoFloatingButton />
    </div>
  );
}

export default PortalPage;
