import { useState } from "react";
import { login } from "../../services/auth.service";
import type { LoginReq } from "../../types/auth.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./AuthProvider.tsx";

export const useLoginForm = () => {

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setIsLoggedIn } = useAuth();

  // State quản lý hiệu ứng Focus cho icon
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ email, password, rememberMe } as LoginReq);
      // Lưu token vào localStorage (hoặc cookie tùy bạn chọn)
      localStorage.setItem("accessToken", response.data.accessToken);
      toast.success('Login successful')

      setIsLoggedIn(true);

      navigate("/admin/dashboard");
    } catch (err: any) {
      const message = Array.isArray(err.response?.data?.message)
        ? err.response.data.message[0]
        : err.response?.data?.message;

      toast.error(message || "Login failed");
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    rememberMe, setRememberMe,
    showPassword, setShowPassword,
    emailFocus, setEmailFocus,
    passwordFocus, setPasswordFocus,
    handleLogin
  };
};