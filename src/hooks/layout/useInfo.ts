import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import { userService } from "../../services/admin/user.service";
import type { User } from "../../types/user/user";

export const useInfo = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const decoded = jwtDecode<JwtPayloadCustom>(token);
      const fetchUser = async () => {
        try {
          const data = await userService.getUserById(decoded.sub);
          setUser(data.data);
        } catch (err) {
          console.error("Lỗi lấy user", err);
        }
      };
      fetchUser();
    } catch (err) {
      console.error("Token lỗi", err);
    }
  }, []);

  return user;
};