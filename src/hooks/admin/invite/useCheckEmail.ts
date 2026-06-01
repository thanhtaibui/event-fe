import { useState } from "react";
import { inviteService } from "../../../services/admin/invite.service";
import type { CheckEmailPayload } from "../../../types/invite/check";

export const useCheckEmail = () => {
  const [data, setData] = useState<any>([]);
  const checkEmails = async (payload: CheckEmailPayload) => {
    try {
      const res = await inviteService.checkEmail(payload)
      // console.log(res.data)
      setData(res.data)
      return res.data;
    } catch (error) {

    }
  };
  return { checkEmails };
}