import { useState } from "react";
import {
  login,
  loginWithGoogle,
  register,
} from "../../services/auth.service";
import type { LoginReq, RegisterReq } from "../../types/auth.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./AuthProvider.tsx";
import { AxiosError } from "axios";
import { setAccessToken } from "../../constants/authStorage.ts";

type ApiErrorResponse = {
  message?: string | string[];
};

type GoogleAccounts = {
  id?: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential?: string }) => void;
    }) => void;
    prompt: (callback?: (notification: {
      isNotDisplayed?: () => boolean;
      isSkippedMoment?: () => boolean;
      getNotDisplayedReason?: () => string;
      getSkippedReason?: () => string;
    }) => void) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

type UseLoginFormOptions = {
  mode?: "login" | "register";
};

const GOOGLE_SCRIPT_ID = "eventix-google-identity";
const GOOGLE_CLIENT_ID_KEYS = [
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_AUTH_CLIENT_ID",
  "VITE_GOOGLE_OAUTH_CLIENT_ID",
];

function getGoogleClientId() {
  return GOOGLE_CLIENT_ID_KEYS.map((key) => import.meta.env[key]).find(Boolean);
}

function getApiMessage(err: unknown, fallback: string) {
  const axiosError = err as AxiosError<ApiErrorResponse>;
  const message = Array.isArray(axiosError.response?.data?.message)
    ? axiosError.response.data.message[0]
    : axiosError.response?.data?.message;

  return message || fallback;
}

function getAccessTokenFromResponse(response: any) {
  return response?.data?.accessToken || response?.accessToken;
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export const useLoginForm = ({ mode = "login" }: UseLoginFormOptions = {}) => {

  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { setIsLoggedIn } = useAuth();

  // State quản lý hiệu ứng Focus cho icon
  const [fullNameFocus, setFullNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [confirmPasswordFocus, setConfirmPasswordFocus] = useState(false);

  const completeAuth = (
    response: any,
    successMessage: string,
    options: { requireToken?: boolean; fallbackRedirect?: string } = {},
  ) => {
    const { requireToken = true, fallbackRedirect = "/login" } = options;
    const accessToken = getAccessTokenFromResponse(response);

    if (!accessToken) {
      if (!requireToken) {
        toast.success(successMessage);
        navigate(fallbackRedirect);
        return;
      }

      throw new Error("No access token returned from server");
    }

    setAccessToken(accessToken);
    toast.success(successMessage);
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleLogin = async () => {
    const response = await login({ email, password, rememberMe } as LoginReq);
    completeAuth(response, "Login successful");
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const response = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    } as RegisterReq);

    completeAuth(response, "Account created successfully", {
      requireToken: false,
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isGoogleSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (err) {
      toast.error(
        getApiMessage(
          err,
          mode === "register" ? "Register failed" : "Login failed",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      toast.error("Missing VITE_GOOGLE_CLIENT_ID for Google login");
      return;
    }

    setIsGoogleSubmitting(true);

    try {
      await loadGoogleIdentityScript();

      const googleId = window.google?.accounts?.id;

      if (!googleId) {
        toast.error("Unable to start Google login");
        setIsGoogleSubmitting(false);
        return;
      }

      googleId.initialize({
        client_id: clientId,
        callback: async (googleResponse) => {
          if (!googleResponse.credential) {
            setIsGoogleSubmitting(false);
            toast.error("Google login was cancelled");
            return;
          }

          try {
            const response = await loginWithGoogle({
              idToken: googleResponse.credential,
              rememberMe,
            });
            completeAuth(response, "Google login successful");
          } catch (err) {
            toast.error(getApiMessage(err, "Google login failed"));
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
      });

      googleId.prompt((notification) => {
        if (
          notification.isNotDisplayed?.() ||
          notification.isSkippedMoment?.()
        ) {
          setIsGoogleSubmitting(false);
          toast.error("Google login popup was not displayed");
        }
      });
    } catch {
      toast.error("Unable to load Google login");
      setIsGoogleSubmitting(false);
    }
  };

  return {
    mode,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    rememberMe, setRememberMe,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    fullNameFocus, setFullNameFocus,
    emailFocus, setEmailFocus,
    passwordFocus, setPasswordFocus,
    confirmPasswordFocus, setConfirmPasswordFocus,
    isSubmitting,
    isGoogleSubmitting,
    handleAuthSubmit,
    handleGoogleLogin
  };
};
