import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../../services/api";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../../constants/authStorage";

type AuthContextValue = {
  isAuthReady: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

type AccessTokenPayload = {
  exp?: number;
};

function isTokenExpired(token: string) {
  try {
    const decoded = jwtDecode<AccessTokenPayload>(token);
    if (!decoded.exp) return true;

    const refreshSkewMs = 10_000;
    return decoded.exp * 1000 <= Date.now() + refreshSkewMs;
  } catch {
    return true;
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const updateAuthState = (loggedIn: boolean, ready = true) => {
      if (!mounted) return;
      setIsLoggedIn(loggedIn);
      setIsAuthReady(ready);
    };

    const initAuth = async () => {
      const currentToken = getAccessToken();
      const isAuthPage = ["/login", "/register"].includes(
        window.location.pathname,
      );

      if (!currentToken || isAuthPage) {
        updateAuthState(false);
        return;
      }

      updateAuthState(true, false);

      if (!isTokenExpired(currentToken)) {
        updateAuthState(true);
        return;
      }

      try {
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (!accessToken) {
          throw new Error("No access token returned from refresh");
        }
        setAccessToken(accessToken);
        updateAuthState(true);
      } catch {
        clearAccessToken();
        updateAuthState(false);
      } finally {
        if (mounted) setIsAuthReady(true);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthReady, isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

 
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
