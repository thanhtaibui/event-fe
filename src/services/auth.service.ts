import api from "./api";
import type { GoogleLoginReq, LoginReq, RegisterReq } from "../types/auth.ts";


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
