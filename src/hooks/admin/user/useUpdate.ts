import { useState } from "react";
import type { UpdateUser } from "../../../types/user/update";
import { userService } from "../../../services/admin/user.service";

export const useUpdateUser = () => {
  const [loading, setLoading] = useState(false);

  const updateUser = async (id: string, data: UpdateUser) => {
    try {
      setLoading(true);
      await userService.updateUser(id, data);
      return true;
    } catch (error) {
      // console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  return {
    updateUser,
    loading,
  };
}