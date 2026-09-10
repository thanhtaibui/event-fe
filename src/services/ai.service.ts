import api from "./api";

export type AiMode = "chat" | "generate" | "edit" | "enhance";
export type AiRatio = "1:1" | "16:9" | "9:16";
export type AiEnhanceAction = "upscale" | "remove_background";

export type AiResponse = {
  message: string;
  imageUrl?: string;
};

function unwrapAiResponse(value: unknown): AiResponse {
  const payload = value as any;
  const data = payload?.data || payload;
  const imageUrl =
    data?.imageUrl ||
    data?.image_url ||
    data?.resultUrl ||
    data?.result_url ||
    data?.url ||
    data?.fileUrl ||
    data?.file_url ||
    data?.secureUrl ||
    data?.secure_url;
  const message =
    data?.message ||
    data?.reply ||
    data?.content ||
    data?.text ||
    payload?.message ||
    payload?.reply ||
    payload?.content ||
    payload?.text ||
    (imageUrl ? "Ảnh đã xử lý xong." : "AI đã phản hồi.");

  return { message, imageUrl };
}

export async function sendAiChat(message: string) {
  const response = await api.post(
    "/ai/chat",
    { message },
    { skipGlobalToast: true } as any,
  );

  return unwrapAiResponse(response.data);
}

export async function generateAiImage(description: string, ratio: AiRatio) {
  const response = await api.post(
    "/ai/image/generate",
    { description, ratio },
    { skipGlobalToast: true } as any,
  );

  return unwrapAiResponse(response.data);
}

export async function editAiImage(image: File | string, description: string, ratio: AiRatio, style: string) {
  const formData = new FormData();
  if (typeof image === "string") {
    formData.append("imageUrl", image);
  } else {
    formData.append("file", image);
  }
  formData.append("description", description);
  formData.append("ratio", ratio);
  if (style) formData.append("style", style);

  const response = await api.post("/ai/image/edit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    skipGlobalToast: true,
  } as any);

  return unwrapAiResponse(response.data);
}

export async function enhanceAiImage(image: File | string, action: AiEnhanceAction) {
  const formData = new FormData();
  if (typeof image === "string") {
    formData.append("imageUrl", image);
  } else {
    formData.append("file", image);
  }
  formData.append("action", action);

  const response = await api.post("/ai/image/enhance", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    skipGlobalToast: true,
  } as any);

  return unwrapAiResponse(response.data);
}
