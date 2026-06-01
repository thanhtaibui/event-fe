import { useState } from "react";
import type { sendEmail } from "../../../types/invite/send";
import { inviteService } from "../../../services/admin/invite.service";

export const useSend = () => {
  const [loading, setLoading] = useState(false);

  const sendEmail = async (send: sendEmail) => {
    try {
      setLoading(true);
      await inviteService.sendInvites(send);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    loading,
  };
};

