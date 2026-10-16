import api from "./api";

export type AiMode = "chat" | "generate" | "edit" | "enhance";
export type AiChatRequestMode = "chat" | "image_prompt_builder";
export type AiRatio = "1:1" | "16:9" | "9:16";
export type AiEnhanceAction = "upscale" | "remove_background";

export type AiPromptPlan = {
  summary?: string;
  eventName?: string;
  organization?: string;
  theme?: string;
  audience?: string;
  style?: string;
  colors?: string[];
  missingFields?: string[];
  imagePrompt?: string;
  generatedPrompt?: string;
  negativePrompt?: string;
  canUseForCreate?: boolean;
  language?: string;
  locale?: string;
};

export type AiResponse = {
  message: string;
  imageUrl?: string;
  status?: string;
  mode?: string;
  language?: string;
  promptPlan?: AiPromptPlan;
};

type PreparedImageEditSource =
  | {
      imageUrl: string;
      imageData?: never;
    }
  | {
      imageData: string;
      imageUrl?: never;
    };

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isDataUrl(value: string) {
  return /^data:/i.test(value) || /^data\//i.test(value);
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Không thể đọc ảnh nguồn. Vui lòng chọn lại ảnh."));
    };

    reader.onerror = () => reject(new Error("Không thể đọc ảnh nguồn. Vui lòng chọn lại ảnh."));
    reader.readAsDataURL(blob);
  });
}

async function blobUrlToDataUrl(source: string) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error("Không thể đọc ảnh nguồn. Vui lòng chọn lại ảnh.");
  }

  const blob = await response.blob();
  return readBlobAsDataUrl(blob);
}

export async function prepareImageEditSource(
  source: File | string,
): Promise<PreparedImageEditSource> {
  if (source instanceof File) {
    return { imageData: await readBlobAsDataUrl(source) };
  }

  const trimmedSource = source.trim();

  if (isHttpUrl(trimmedSource)) {
    return { imageUrl: trimmedSource };
  }

  if (isDataUrl(trimmedSource)) {
    return { imageData: trimmedSource };
  }

  if (trimmedSource.startsWith("blob:")) {
    return { imageData: await blobUrlToDataUrl(trimmedSource) };
  }

  throw new Error("Không thể đọc ảnh nguồn. Vui lòng chọn lại ảnh.");
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return Object.entries(item as Record<string, unknown>)
            .map(([key, entry]) => `${key}: ${String(entry)}`)
            .join(", ");
        }
        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}: ${String(entry)}`)
      .filter(Boolean);
  }

  return [String(value)];
}

function normalizeText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function normalizeMode(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readField(source: any, keys: string[]) {
  return keys.reduce<unknown>((result, key) => result || source?.[key], undefined);
}

function unwrapAiResponse(value: unknown): AiResponse {
  const payload = value as any;
  const data = payload?.data || payload;
  const structuredContent = data?.content && typeof data.content === "object" ? data.content : null;
  const fieldSource = structuredContent || data;
  const status =
    data?.status ||
    data?.mode ||
    structuredContent?.mode ||
    structuredContent?.status ||
    structuredContent?.type ||
    payload?.status ||
    payload?.mode ||
    data?.type ||
    payload?.type;
  const responseMode = normalizeMode(status);
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
    (typeof data?.content === "string" ? data.content : undefined) ||
    (typeof structuredContent?.summary === "string" ? structuredContent.summary : undefined) ||
    data?.text ||
    payload?.message ||
    payload?.reply ||
    (typeof payload?.content === "string" ? payload.content : undefined) ||
    payload?.text ||
    (imageUrl ? "Ảnh đã xử lý xong." : "AI đã phản hồi.");

  const imagePrompt = normalizeText(
    readField(fieldSource, ["imagePrompt", "image_prompt", "generatedPrompt", "generated_prompt", "prompt"]) ||
      readField(payload, ["imagePrompt", "image_prompt", "generatedPrompt", "generated_prompt", "prompt"]),
  );
  const summarySource = readField(fieldSource, ["summary"]) || readField(payload, ["summary"]);
  const summaryFields = isPlainRecord(summarySource) ? summarySource : {};
  const summary = typeof summarySource === "string" ? normalizeText(summarySource) : "";
  const readSummaryField = (keys: string[]) =>
    readField(summaryFields, keys) || readField(fieldSource, keys) || readField(payload, keys);
  const locale = normalizeText(readField(fieldSource, ["locale", "language"]) || readField(payload, ["locale", "language"]));
  const promptPlan =
    responseMode === "image_prompt_ready" && imagePrompt
      ? {
          summary,
          eventName: normalizeText(readSummaryField(["eventName", "event_name"])),
          organization: normalizeText(readSummaryField(["organization", "orgName", "org_name"])),
          theme: normalizeText(readSummaryField(["theme"])),
          audience: normalizeText(readSummaryField(["audience"])),
          style: normalizeText(readSummaryField(["style"])),
          colors: normalizeList(readSummaryField(["colors"])),
          missingFields: normalizeList(readField(fieldSource, ["missingFields", "missing_fields"]) || readField(payload, ["missingFields", "missing_fields"])),
          imagePrompt,
          generatedPrompt: imagePrompt,
          negativePrompt: normalizeText(readField(fieldSource, ["negativePrompt", "negative_prompt"])),
          canUseForCreate: fieldSource?.canUseForCreate ?? fieldSource?.can_use_for_create ?? true,
          language: locale,
          locale,
        }
      : undefined;

  return { message, imageUrl, status, mode: responseMode, language: locale, promptPlan };
}

export async function sendAiChat(message: string, mode: AiChatRequestMode = "chat") {
  const response = await api.post(
    "/ai/chat",
    { message, mode },
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
  const preparedImageSource = await prepareImageEditSource(image);
  const payload = {
    prompt: description,
    ratio,
    ...(style ? { style } : {}),
    ...preparedImageSource,
  };

  const response = await api.post("/ai/image/edit", payload, {
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
