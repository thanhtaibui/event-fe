import { useState } from "react";
import { inviteService } from "../../../services/admin/invite.service";

export const useStatus = () => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (action: string, token: string) => {
    setLoading(true);
    try {
      const res = await inviteService.updateStatusByToken(action, token);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateStatus,
  };
};