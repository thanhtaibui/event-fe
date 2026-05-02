import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service"
import type { PayloadOrganizationDto } from "../../../types/organization/create"

export const useUpdateOrg = () => {
  const [loading, setLoading] = useState(false);

  const updateOrg = async (id: string, updateOrg: PayloadOrganizationDto) => {
    try {
      setLoading(true);
      await orgService.updateOrg(id, updateOrg);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateOrg,
    loading,
  };
};

