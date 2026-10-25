import api from "../api";

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export const DEFAULT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const DEFAULT_DOCUMENT_TYPES = [
  ...DEFAULT_IMAGE_TYPES,
  "application/pdf",
];

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Kiểm tra tính hợp lệ của file trước khi gửi lên server.
 */
export function validateUploadFile(
  file: File,
  options?: FileValidationOptions,
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  const maxSizeBytes = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${maxMb}MB limit (actual: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  const allowedTypes = options?.allowedTypes ?? DEFAULT_IMAGE_TYPES;
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type || "unknown"}' is not supported. Allowed: ${allowedTypes.map((t) => t.replace("image/", "").replace("application/", "")).join(", ")}`,
    };
  }

  return { valid: true };
}

export {
  R2_PUBLIC_HOSTNAME,
  R2_BUCKET_SEGMENT,
  normalizeMediaUrl,
  deepNormalizeMediaUrls,
} from "../../utils/imageUtils";
import { normalizeMediaUrl } from "../../utils/imageUtils";

/**
 * Trích xuất URL hợp lệ từ response của Backend upload API (Cloudflare R2, S3, hoặc Cloudinary fallback).
 * Tự động chuẩn hóa đường dẫn nếu URL R2 bị thiếu segment 'eventix-media'.
 * Tuyệt đối từ chối blob: hoặc data: preview URLs hoặc các chuỗi không phải HTTP/HTTPS.
 */
export function extractUploadUrl(response: unknown): string {
  if (!response) {
    throw new Error("Empty response from upload service");
  }

  if (typeof response === "string") {
    const trimmed = response.trim();
    if (isValidHttpUrl(trimmed)) return normalizeMediaUrl(trimmed);
    if (isTemporaryPreviewUrl(trimmed)) {
      throw new Error("Temporary preview URL cannot be used as permanent storage URL");
    }
    throw new Error(`Upload response returned invalid URL string: ${trimmed.slice(0, 50)}`);
  }

  const payload = response as Record<string, any>;
  const data = payload.data && typeof payload.data === "object" ? payload.data : null;
  const directDataString = typeof payload.data === "string" ? payload.data.trim() : null;

  // Thứ tự ưu tiên trích xuất URL hoàn chỉnh
  const candidateKeys = [
    "url",
    "secure_url",
    "location",
    "Location",
    "fileUrl",
    "imageUrl",
    "documentUrl",
    "path",
  ];

  for (const key of candidateKeys) {
    const directVal = payload[key];
    if (typeof directVal === "string" && isValidHttpUrl(directVal.trim())) {
      return normalizeMediaUrl(directVal.trim());
    }
    if (data && typeof data[key] === "string" && isValidHttpUrl(data[key].trim())) {
      return normalizeMediaUrl(data[key].trim());
    }
  }

  if (directDataString && isValidHttpUrl(directDataString)) {
    return normalizeMediaUrl(directDataString);
  }

  // Kiểm tra nếu response vô tình chứa blob: hoặc data:
  for (const key of candidateKeys) {
    const val = payload[key] || (data && data[key]);
    if (typeof val === "string" && isTemporaryPreviewUrl(val)) {
      throw new Error("Received temporary preview URL instead of permanent cloud storage URL");
    }
  }

  throw new Error("Upload response did not contain a valid HTTP/HTTPS storage URL");
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  return value.startsWith("https://") || value.startsWith("http://");
}

function isTemporaryPreviewUrl(value: string): boolean {
  if (!value) return false;
  return value.startsWith("blob:") || value.startsWith("data:");
}

export const uploadService = {
  /**
   * Upload file multipart/form-data qua Backend upload API thống nhất.
   * Endpoint chuẩn: POST /upload/image
   */
  upload: async (formData: FormData) => {
    const res = await api.post("upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 90000,
      // @ts-expect-error custom config property for api interceptor
      skipGlobalToast: true,
    });
    return res.data;
  },

  /**
   * Upload và trích xuất trực tiếp URL R2 hoàn chỉnh từ response.
   */
  uploadAndGetUrl: async (formData: FormData): Promise<string> => {
    const raw = await uploadService.upload(formData);
    return extractUploadUrl(raw);
  },
};