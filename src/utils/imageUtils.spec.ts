import { normalizeMediaUrl, deepNormalizeMediaUrls } from "./imageUtils";

function assertStrictEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${msg || ""}`);
  }
}

console.log("=== BẮT ĐẦU KIỂM THỬ REGRESSION R2 URL BUILDER & RESOLVER ===");

// 1. URL mới upload chuẩn dạng https://pub-*.r2.dev/banner/<uuid>.png -> Giữ nguyên (vì key thực tế trên R2 là banner/<uuid>.png)
const newUploadUrl = "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/d0b4c450-c7c4-437d-8bdb-837dcb351b9c.png";
assertStrictEqual(
  normalizeMediaUrl(newUploadUrl),
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/d0b4c450-c7c4-437d-8bdb-837dcb351b9c.png",
  "URL mới upload chuẩn không được thêm segment thừa"
);
console.log("✓ Test 1 PASS: URL mới upload chuẩn giữ nguyên HTTP 200");

// 2. URL legacy thiếu segment 1-1792936718399.png -> Đã được thêm segment /eventix-media/
const legacyMissingSegment = "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/1-1792936718399.png";
assertStrictEqual(
  normalizeMediaUrl(legacyMissingSegment),
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/banner/1-1792936718399.png",
  "URL legacy 1-1792936718399.png phải được bổ sung segment /eventix-media/"
);
console.log("✓ Test 2 PASS: URL legacy thiếu segment được tự động chữa lành thành công");

// 3. URL legacy đã chứa segment -> Giữ nguyên
const legacyWithSegment = "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/banner/1-1792936718399.png";
assertStrictEqual(
  normalizeMediaUrl(legacyWithSegment),
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/banner/1-1792936718399.png",
  "URL đã có segment không bị thay đổi"
);
console.log("✓ Test 3 PASS: URL legacy đã có segment giữ nguyên cấu trúc chuẩn");

// 4. URL lặp segment /eventix-media/eventix-media/ -> Khử lặp
const repeatedSegment = "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/eventix-media/banner/sample.png";
assertStrictEqual(
  normalizeMediaUrl(repeatedSegment),
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/banner/sample.png",
  "URL lặp segment phải được khử lặp về 1 segment duy nhất"
);
console.log("✓ Test 4 PASS: Không tạo URL lặp segment /eventix-media/");

// 5. URL Cloudinary legacy -> Giữ nguyên 100%
const cloudinaryUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
assertStrictEqual(
  normalizeMediaUrl(cloudinaryUrl),
  cloudinaryUrl,
  "URL Cloudinary legacy không được thay đổi"
);
console.log("✓ Test 5 PASS: URL Cloudinary legacy được giữ nguyên 100%");

// 6. Private document key -> Giữ nguyên
const privateDocKey = "documents/8b16cf42-0ccc-48da-97ef-e80362a82df9/tax-doc.pdf";
assertStrictEqual(
  normalizeMediaUrl(privateDocKey),
  privateDocKey,
  "Private document key không được biến thành public URL"
);
console.log("✓ Test 6 PASS: Private document key an toàn tuyệt đối");

// 7. deepNormalizeMediaUrls xử lý object lồng nhau
const apiResponse = {
  statusCode: 200,
  data: {
    event: {
      id: "5878fbbe-fe74-4adb-8a91-86d6a3f0b12d",
      eventBanner: "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/1-1792936718399.png",
      newBanner: "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/d0b4c450-c7c4-437d-8bdb-837dcb351b9c.png",
      cloudinaryPoster: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      documentKey: "private/documents/org-1/verification.pdf"
    }
  }
};
const normalizedResponse = deepNormalizeMediaUrls(apiResponse);
assertStrictEqual(
  normalizedResponse.data.event.eventBanner,
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/eventix-media/banner/1-1792936718399.png",
  "Ảnh legacy trong response lồng nhau phải được tự động chữa lành"
);
assertStrictEqual(
  normalizedResponse.data.event.newBanner,
  "https://pub-1d23fdf1326645dfa0c6db5d96c779a5.r2.dev/banner/d0b4c450-c7c4-437d-8bdb-837dcb351b9c.png",
  "Ảnh mới upload trong response lồng nhau phải giữ nguyên URL 200 OK"
);
assertStrictEqual(
  normalizedResponse.data.event.cloudinaryPoster,
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "Cloudinary URL không bị đổi"
);
assertStrictEqual(
  normalizedResponse.data.event.documentKey,
  "private/documents/org-1/verification.pdf",
  "Private document key không bị đổi"
);
console.log("✓ Test 7 PASS: deepNormalizeMediaUrls xử lý hoàn hảo cấu trúc response lồng nhau");

console.log("=== TẤT CẢ KIỂM THỬ REGRESSION ĐÃ THÀNH CÔNG RỰC RỠ 100% ===");
