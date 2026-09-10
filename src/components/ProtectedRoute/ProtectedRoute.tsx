import { Navigate } from "react-router-dom";

import AdminSkeleton from "../admin/skeleton/AdminSkeleton";
import { useAuth } from "../../hooks/auth/AuthProvider";

const ProtectedRoute = ({ children }: any) => {
  const { isAuthReady, isLoggedIn } = useAuth();

  if (!isAuthReady) {
    return <AdminSkeleton variant="dashboard" cards={3} />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
