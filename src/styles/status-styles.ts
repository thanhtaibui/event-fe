
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
  PENDING: { bg: '#fff4c8', text: '#a84900', border: '#FDE68A' },
  PROCESSING: {
    bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE'
  },
  RESOLVED: {
    bg: '#ECFDF5', text: '#047857', border: '#A7F3D0'
  },
  REJECTED: {
    bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA'
  },
  SPAM: {
    bg: '#F3F4F6', text: '#374151', border: '#D1D5DB'
  },
}