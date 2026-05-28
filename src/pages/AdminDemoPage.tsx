import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { AdminDemoApp } from "@/features/admin-demo/AdminDemoApp";

export function AdminDemoPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(AUTH_CONFIG.routes.login, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return <AdminDemoApp />;
}

export default AdminDemoPage;
