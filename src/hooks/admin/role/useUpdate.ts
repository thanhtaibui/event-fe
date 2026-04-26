import { useState } from "react";
import { roleService } from "../../../services/admin/role.service";
import type { RolePayload } from "../../../types/role/payload";

export const useUpdateRole = () => {
  const [loading, setLoading] = useState(false);

  const updateRole = async (id: string, payload: RolePayload) => {
    try {
      setLoading(true);
      console.log(payload)
      await roleService.updateRole(id, payload);
      return true;
    } catch (error) {
      // console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  return {
    updateRole,
    loading,
  };
}