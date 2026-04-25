import { useState } from "react";
// import type { CreateUser } from "../../../types/Role/create"
import { roleService } from "../../../services/admin/role.service";
import type { Role } from "../../../types/role/role";

export const useCreateRole = () => {
  const [loading, setLoading] = useState(false);

  const createRole = async (role: Role) => {
    try {
      setLoading(true);
      await roleService.createRole(role);
      return true;
    } catch (error) {
      // console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createRole,
    loading,
  };
};