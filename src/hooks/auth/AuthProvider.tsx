import { createContext, useContext, useEffect, useState } from "react";
import api from "../../services/api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const accessToken = res.data.data.accessToken;
        localStorage.setItem("accessToken", accessToken);

        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthReady, isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
