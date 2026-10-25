import api from "./api";
import type {
  ForgotPasswordReq,
  GoogleLoginReq,
  LoginReq,
  RegisterReq,
  ResetPasswordReq,
} from "../types/auth.ts";

export const login = async (loginReq: LoginReq) => {
  const res = await api.post(
    "/auth/login",
    {
      email: loginReq.email,
      password: loginReq.password,
      rememberMe: loginReq.rememberMe,
    },
    { withCredentials: true },
  );
  return res.data;
};

export const register = async (registerReq: RegisterReq) => {
  const res = await api.post(
    "/auth/register",
    {
      fullName: registerReq.fullName,
      email: registerReq.email,
      password: registerReq.password,
    },
    { withCredentials: true },
  );
  return res.data;
};

export const loginWithGoogle = async (googleLoginReq: GoogleLoginReq) => {
  const res = await api.post("/auth/google", googleLoginReq, {
    withCredentials: true,
  });
  return res.data;
};

export const requestPasswordReset = async (
  forgotPasswordReq: ForgotPasswordReq,
) => {
  const res = await api.post(
    "/auth/forgot-password",
    { email: forgotPasswordReq.email.trim().toLowerCase() },
    {
      skipAuth: true,
      skipGlobalToast: true,
    } as any,
  );
  return res.data;
};

export const resetPassword = async (resetPasswordReq: ResetPasswordReq) => {
  const res = await api.post(
    "/auth/reset-password",
    {
      token: resetPasswordReq.token,
      newPassword: resetPasswordReq.newPassword,
    },
    {
      skipAuth: true,
      skipGlobalToast: true,
    } as any,
  );
  return res.data;
};
