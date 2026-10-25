import {
  normalizeMediaUrl,
  deepNormalizeMediaUrls,
  R2_PUBLIC_HOSTNAME,
  R2_BUCKET_SEGMENT,
} from "./imageUtils";

function assertStrictEqual(actual: unknown, expected: unknown, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${String(expected)}\nActual:   ${String(actual)}`);
  }
}
const assert = { strictEqual: assertStrictEqual };

console.log("=== BẮT ĐẦU KIỂM THỬ REGRESSION R2 URL BUILDER & RESOLVER ===");

// 1. Trường hợp Base URL không có segment bucket
const missingBucketUrl = `https://${R2_PUBLIC_HOSTNAME}/banner/1-1792936718399.png`;
const fixedUrl = normalizeMediaUrl(missingBucketUrl);
assert.strictEqual(
  fixedUrl,
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/banner/1-1792936718399.png`,
  "Base URL thiếu segment bucket phải được tự động bổ sung /eventix-media/"
);
console.log("✓ Test 1 PASS: Base URL không có segment bucket -> đã thêm segment");

// 2. Trường hợp Base URL đã chứa segment bucket
const validUrl = `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/banner/1-1792936718399.png`;
assert.strictEqual(
  normalizeMediaUrl(validUrl),
  validUrl,
  "Base URL đã có segment bucket phải giữ nguyên"
);
console.log("✓ Test 2 PASS: Base URL đã chứa segment bucket -> giữ nguyên");

// 3. Trường hợp Object key bắt đầu bằng banner/
const bannerKeyUrl = `https://${R2_PUBLIC_HOSTNAME}/banner/test-key-uuid.jpg`;
assert.strictEqual(
  normalizeMediaUrl(bannerKeyUrl),
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/banner/test-key-uuid.jpg`,
  "Object key bắt đầu bằng banner/ phải có prefix bucket"
);
console.log("✓ Test 3 PASS: Object key bắt đầu bằng banner/ -> được thêm prefix bucket");

// 4. Trường hợp Object key đã chứa prefix bucket
const prefixedUrl = `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/logo/org-logo.png`;
assert.strictEqual(
  normalizeMediaUrl(prefixedUrl),
  prefixedUrl,
  "Object key đã chứa prefix bucket không bị thay đổi"
);
console.log("✓ Test 4 PASS: Object key đã chứa prefix bucket -> giữ nguyên");

// 5. Ngăn chặn tạo URL thiếu hoặc lặp segment (eventix-media/eventix-media)
const doubleSegmentUrl = `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/${R2_BUCKET_SEGMENT}/banner/1-1792936718399.png`;
assert.strictEqual(
  normalizeMediaUrl(doubleSegmentUrl),
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/banner/1-1792936718399.png`,
  "URL bị lặp double segment phải được loại bỏ segment thừa"
);

const tripleSegmentUrl = `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/${R2_BUCKET_SEGMENT}/${R2_BUCKET_SEGMENT}/item/poster.png`;
assert.strictEqual(
  normalizeMediaUrl(tripleSegmentUrl),
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/item/poster.png`,
  "URL bị lặp triple segment phải được chuẩn hóa về 1 segment"
);
console.log("✓ Test 5 PASS: Không tạo URL thiếu hoặc lặp segment");

// 6. URL Cloudinary legacy vẫn được giữ nguyên
const cloudinaryUrls = [
  "https://res.cloudinary.com/eventix/image/upload/v12345/events/banner.jpg",
  "https://res.cloudinary.com/demo/image/upload/sample.png",
  "https://cloudinary.com/images/test.webp",
];
for (const cUrl of cloudinaryUrls) {
  assert.strictEqual(
    normalizeMediaUrl(cUrl),
    cUrl,
    `Cloudinary legacy URL [${cUrl}] phải giữ nguyên 100%`
  );
}
console.log("✓ Test 6 PASS: URL Cloudinary legacy được giữ nguyên 100%");

// 7. Private document key không bị biến thành public URL
const privateKeys = [
  "org-verification/550e8400-e29b-41d4-a716-446655440000/license.pdf",
  "org-verification/123/tax.png",
  "documentKey-sample-private",
];
for (const pKey of privateKeys) {
  assert.strictEqual(
    normalizeMediaUrl(pKey),
    pKey,
    `Private document key [${pKey}] không được biến thành public URL`
  );
}
console.log("✓ Test 7 PASS: Private document key không bị biến thành public URL");

// 8. Test deepNormalizeMediaUrls với cấu trúc lồng nhau phức tạp (Event / Org / Item)
const mockApiResponse = {
  status: 200,
  data: {
    event: {
      id: "ev-1",
      title: "Test Event",
      eventBanner: `https://${R2_PUBLIC_HOSTNAME}/banner/1-1792936718399.png`,
      organizer: {
        id: "org-1",
        name: "Community",
        logo: `https://${R2_PUBLIC_HOSTNAME}/logo/org-1.png`,
        legacyBanner: "https://res.cloudinary.com/eventix/image/upload/legacy.jpg",
      },
      items: [
        {
          id: "it-1",
          name: "Ticket VIP",
          imageUrl: `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/item/vip.png`,
        },
      ],
      verificationKey: "org-verification/org-1/doc.pdf",
    },
  },
};

const normalized = deepNormalizeMediaUrls(mockApiResponse);
assert.strictEqual(
  normalized.data.event.eventBanner,
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/banner/1-1792936718399.png`,
  "Deep normalize eventBanner failed"
);
assert.strictEqual(
  normalized.data.event.organizer.logo,
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/logo/org-1.png`,
  "Deep normalize organizer logo failed"
);
assert.strictEqual(
  normalized.data.event.organizer.legacyBanner,
  "https://res.cloudinary.com/eventix/image/upload/legacy.jpg",
  "Deep normalize legacy Cloudinary failed"
);
assert.strictEqual(
  normalized.data.event.items[0].imageUrl,
  `https://${R2_PUBLIC_HOSTNAME}/${R2_BUCKET_SEGMENT}/item/vip.png`,
  "Deep normalize item imageUrl already valid failed"
);
assert.strictEqual(
  normalized.data.event.verificationKey,
  "org-verification/org-1/doc.pdf",
  "Deep normalize private key must not mutate"
);

console.log("✓ Test 8 PASS: deepNormalizeMediaUrls xử lý hoàn hảo cấu trúc response lồng nhau");

console.log("=== TẤT CẢ KIỂM THỬ REGRESSION ĐÃ THÀNH CÔNG RỰC RỠ 100% ===");
