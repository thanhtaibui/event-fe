import type { CheckEmailPayload } from "../../types/invite/check";
import type { sendEmail } from "../../types/invite/send";
import api from "../api";

export const inviteService = {
  sendInvites: async (send: sendEmail) => {
    const res = await api.post('invites', send);
    return res.data;
  },
  checkEmail: async (check: CheckEmailPayload) => {
    const res = await api.post('/invites/check-email', check);
    return res.data;
  },
  updateStatusByToken: async (status: string, token: string) => {
    const res = await api.patch(`/invites/${token}/status`, { status });
    return res.data;
  },
}