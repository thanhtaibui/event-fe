import api from "../api";

export const uploadService = {
  upload: async (formData: FormData) => {
    const res = await api.post(
      `cloudinary/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  },
}