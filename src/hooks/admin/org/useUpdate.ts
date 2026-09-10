import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service"
import type { PayloadOrganizationDto } from "../../../types/organization/create"
import { triggerNotification } from "../../notification/useNotificationTrigger";

export const useUpdateOrg = () => {
  const [loading, setLoading] = useState(false);

  const updateOrg = async (id: string, updateOrg: PayloadOrganizationDto) => {
    try {
      setLoading(true);
      await orgService.updateOrg(id, updateOrg);
      await triggerNotification("ORG_UPDATED", { orgName: updateOrg.name });
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

