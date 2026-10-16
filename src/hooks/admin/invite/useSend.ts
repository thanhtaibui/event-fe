import { useState } from "react";
import type { sendEmail } from "../../../types/invite/send";
import { inviteService } from "../../../services/admin/invite.service";

export const useSend = () => {
  const [loading, setLoading] = useState(false);

  const sendEmail = async (send: sendEmail) => {
    try {
      setLoading(true);
      return await inviteService.sendInvites(send);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    loading,
  };
};

