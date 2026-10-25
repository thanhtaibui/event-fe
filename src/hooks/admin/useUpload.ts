import { useState } from "react";
import { extractUploadUrl, uploadService } from "../../services/admin/uploadCloud";

export const useUpload = () => {
  const [loading, setLoading] = useState(false);

  const upload = async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await uploadService.upload(formData);
      const extractedUrl = extractUploadUrl(res);

      const normalized: Record<string, any> =
        typeof res === "object" && res !== null ? { ...res } : { data: res };

      normalized.url = extractedUrl;
      normalized.secure_url = extractedUrl;

      return normalized;
    } catch (error) {
      console.error("[useUpload] Upload failed or returned invalid URL:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    loading,
  };
};