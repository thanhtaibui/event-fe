import { Navigate, useLocation } from "react-router-dom";

import AdminSkeleton from "../admin/skeleton/AdminSkeleton";
import { useAuth } from "../../hooks/auth/AuthProvider";

const ProtectedRoute = ({ children }: any) => {
  const { isAuthReady, isLoggedIn } = useAuth();
  const location = useLocation();
  const isDetailRoute =
    /^\/admin\/organizations\/[^/]+$/.test(location.pathname) ||
    /^\/admin\/events\/[^/]+$/.test(location.pathname);

  if (!isAuthReady) {
    return <AdminSkeleton variant={isDetailRoute ? "detail" : "dashboard"} cards={3} />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
