import api from "./api";
import type { LoginReq } from "../types/auth.ts";


export const login = async (loginReq: LoginReq) => {
  const res = await api.post("/auth/login", {
    email: loginReq.email,
    password: loginReq.password,
    rememberMe: loginReq.rememberMe,
  });
  return res.data;
};
