import { useState } from "react";
import { userService } from "../../../services/admin/user.service"
import type { CreateUser } from "../../../types/user/create"

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false);

  const createUser = async (data: CreateUser) => {
    try {
      setLoading(true);
      await userService.createUser(data);
      return true;
    } catch (error) {
      // console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    loading,
  };
};