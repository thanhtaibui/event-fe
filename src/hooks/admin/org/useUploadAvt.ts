import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useUploadAvt = () => {
  const [loading, setLoading] = useState(false);

  const uploadAvt = async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await orgService.uploadAvatar(formData);
      // console.log(res.data)
      return res.data;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadAvt,
    loading,
  };
};