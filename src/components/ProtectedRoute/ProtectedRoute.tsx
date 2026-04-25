import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/auth/AuthProvider";
import LoadingPage from "../../pages/LoadingPage";

const ProtectedRoute = ({ children }: any) => {
  const { isAuthReady, isLoggedIn } = useAuth();

  if (!isAuthReady) {
    return <LoadingPage />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
