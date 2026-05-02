import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service"
import type { PayloadOrganizationDto } from "../../../types/organization/create"

export const useCreateOrg = () => {
  const [loading, setLoading] = useState(false);

  const createOrg = async (createOrg: PayloadOrganizationDto) => {
    try {
      setLoading(true);
      await orgService.createOrg(createOrg);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrg,
    loading,
  };
};

