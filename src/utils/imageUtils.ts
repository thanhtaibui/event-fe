import type { Area } from 'react-easy-crop';

/**
 * Chuyển đổi vùng ảnh đã chọn thành một File thực tế
 */
export const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      // Trả về file để gửi lên Cloudinary
      resolve(new File([blob], "cropped-banner.jpg", { type: "image/jpeg" }));
    }, 'image/jpeg', 0.9);
  });
};

export const R2_PUBLIC_HOSTNAME = "pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev";
export const R2_BUCKET_SEGMENT = "eventix-media";

/**
 * Chuẩn hóa URL public của Cloudflare R2 để luôn chứa segment 'eventix-media',
 * bảo toàn URL Cloudinary legacy, private document keys, và ngăn chặn lặp segment.
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Bỏ qua local asset, blob preview hoặc Cloudinary legacy
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.includes("cloudinary.com")
  ) {
    return trimmed;
  }

  // Chỉ chuẩn hóa nếu là URL của R2 development domain
  if (!trimmed.includes(".r2.dev")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const isR2DevDomain =
      parsed.hostname === R2_PUBLIC_HOSTNAME ||
      (parsed.hostname.endsWith(".r2.dev") && !parsed.hostname.includes("cloudflarestorage.com"));

    if (isR2DevDomain) {
      // Giữ nguyên nếu là signed URL tạm thời có query signature
      if (parsed.search || parsed.hash) return trimmed;

      let pathname = parsed.pathname.replace(/\/+/g, "/");
      if (!pathname.startsWith("/")) pathname = "/" + pathname;

      if (
        !pathname.startsWith(`/${R2_BUCKET_SEGMENT}/`) &&
        pathname !== `/${R2_BUCKET_SEGMENT}`
      ) {
        parsed.pathname = `/${R2_BUCKET_SEGMENT}${pathname}`;
      } else {
        const doublePrefix = `/${R2_BUCKET_SEGMENT}/${R2_BUCKET_SEGMENT}/`;
        while (parsed.pathname.startsWith(doublePrefix)) {
          parsed.pathname = parsed.pathname.replace(doublePrefix, `/${R2_BUCKET_SEGMENT}/`);
        }
      }
      return parsed.toString();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/**
 * Đệ quy chuẩn hóa các URL media trong data payload nhận từ Backend.
 */
export function deepNormalizeMediaUrls<T>(data: T): T {
  if (!data || typeof data !== "object") {
    if (typeof data === "string") {
      return normalizeMediaUrl(data) as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => deepNormalizeMediaUrls(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = deepNormalizeMediaUrls(value);
  }
  return result as T;
}