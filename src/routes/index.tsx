import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ROUTES } from "./routes";
import { ProtectedRoute } from "./ProtectedRoute";

// Import pages/components
import { AuthSsoPage, BlockedPage, LoginPage, PortalPage } from "@/pages";

function NotFoundPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

// Create router
const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.AUTH_SSO,
    element: <AuthSsoPage />,
  },
  {
    path: ROUTES.PORTAL,
    element: (
      <ProtectedRoute>
        <PortalPage />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.WORKSPACE} replace />,
      },
      {
        path: "workspace",
        element: null, // Handled by PortalPage internal state
      },
      {
        path: "lead",
        element: null, // Handled by PortalPage internal state
      },
    ],
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
  {
    path: ROUTES.BLOCKED,
    element: <BlockedPage />,
  },
  {
    path: "*",
    element: <Navigate to={ROUTES.NOT_FOUND} replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { router };
export default AppRouter;
