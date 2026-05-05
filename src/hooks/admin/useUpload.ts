import { useState } from "react";
import { uploadService } from "../../services/admin/uploadCloud";

export const useUpload = () => {
  const [loading, setLoading] = useState(false);

  const upload = async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await uploadService.upload(formData);
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
    upload,
    loading,
  };
};