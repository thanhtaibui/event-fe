
export const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "#feb4b4", text: "#ef4444", border: "#fca5a5" },
  STAFF: { bg: "#add0fe", text: "#3b82f6", border: "#93c5fd" },
  ORG: { bg: "#acf5cf", text: "#10b981", border: "#6ee7b7" },
  GUEST: { bg: "#dadada", text: "#6b7280", border: "#d1d5db" },
};
export const ROLE_COLOR_PALETTE = {
  red: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  blue: { bg: "#dbeafe", text: "#2563eb", border: "#93c5fd" },
  green: { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  yellow: { bg: "#fef9c3", text: "#ca8a04", border: "#fde68a" },
  purple: { bg: "#f3e8ff", text: "#9333ea", border: "#d8b4fe" },
  pink: { bg: "#fce7f3", text: "#db2777", border: "#f9a8d4" },
  gray: { bg: "#f3f4f6", text: "#555e6d", border: "#d1d5db" },
  orange: { bg: "#ffedd5", text: "#ea580c", border: "#fdba74" },
  cyan: { bg: "#cffafe", text: "#0891b2", border: "#67e8f9" },
  indigo: { bg: "#e0e7ff", text: "#4f46e5", border: "#a5b4fc" },
  teal: { bg: "#ccfbf1", text: "#0d9488", border: "#5eead4" },
  rose: { bg: "#ffe4e6", text: "#e11d48", border: "#fda4af" },
  amber: { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  slate: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
};
export const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  // Chờ duyệt khi User tạo
  PENDING: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },

  // Đang hoạt động bình thường
  ACTIVE: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },

  // Bị tạm khóa (Ví dụ vi phạm điều khoản)
  SUSPENDED: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },

  // Trạng thái XÓA MỀM (Soft Delete)
  ARCHIVED: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },

  // Từ chối phê duyệt lúc mới tạo
  REJECTED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
}
export const EVENT_STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  // Sắp diễn ra: Dùng tone xanh dương (Blue) tạo cảm giác hy vọng, tin tức mới
  upcoming: {
    bg: '#EBF8FF',
    text: '#2B6CB0',
    border: '#BEE3F8'
  },
  // Đang diễn ra: Dùng tone xanh lá (Green) đậm hơn để nhấn mạnh tính "Live"
  ongoing: {
    bg: '#F0FFF4',
    text: '#22543D',
    border: '#C6F6D5'
  },
  // Đã kết thúc: Dùng tone xám (Gray) vì sự kiện đã lùi về quá khứ, không cần quá nổi bật
  ended: {
    bg: '#EDF2F7',
    text: '#4A5568',
    border: '#E2E8F0'
  },
  // Bị hủy: Dùng tone đỏ/cam (Red/Rose) để cảnh báo nhưng vẫn dịu mắt
  cancelled: {
    bg: '#FFF5F5',
    text: '#C53030',
    border: '#FED7D7'
  },
};