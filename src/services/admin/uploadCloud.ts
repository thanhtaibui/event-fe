import api from "../api";

export const uploadService = {
  // upload: async (formData: FormData) => {
  //   const res = await api.post(
  //     `cloudinary/upload`,
  //     formData,
  //     {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     }
  //   );
  //   return res.data;
  // },
  upload: async (formData: FormData) => {
    const res = await api.post(
      `upload/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 90000,
        // @ts-expect-error custom config property for api interceptor
        skipGlobalToast: true,
      }
    );
    return res.data;
  },
};