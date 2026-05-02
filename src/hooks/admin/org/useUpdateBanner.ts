import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service"

export const useUpdateBanner = () => {
  const [loading, setLoading] = useState(false);

  const updateBanner = async (id: string, bannerUrl: string) => {
    try {
      setLoading(true);
      await orgService.updateBanner(id, bannerUrl);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateBanner,
    loading,
  };
};

