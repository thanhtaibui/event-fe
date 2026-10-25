import api from "../api";
import type {
  CreateOrgVerificationPayload,
  UpdateOrgVerificationPayload,
} from "../../types/organization/verification";
import type { Query } from "../../types/query";

export function extractDocumentKey(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const payload = response as Record<string, any>;
  return (
    payload.documentKey ||
    payload.data?.documentKey ||
    payload.key ||
    payload.data?.key ||
    ""
  );
}

export const orgVerificationService = {
  uploadDocument: async (organizationId: string, file: File, config?: any) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(
      `/org-verification/documents?organizationId=${encodeURIComponent(organizationId)}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        ...config,
      }
    );
    return res.data;
  },
  create: async (payload: CreateOrgVerificationPayload, config?: any) => {
    const docKey = payload.documentKey || payload.documentUrl;
    const body: Record<string, any> = {
      organizationId: payload.organizationId,
      taxIdNumber: payload.taxIdNumber,
      ...(docKey ? { documentKey: docKey } : {}),
      ...(payload.documentUrl ? { documentUrl: payload.documentUrl } : (docKey ? { documentUrl: docKey } : {})),
    };
    const res = await api.post("/org-verification", body, config);
    return res.data;
  },
  getAll: async (query?: Query) => {
    const res = await api.get("/org-verification", { params: query });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/org-verification/${id}`);
    return res.data;
  },
  update: async (id: string, payload: UpdateOrgVerificationPayload) => {
    const res = await api.patch(`/org-verification/${id}`, payload);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/org-verification/${id}`);
    return res.data;
  },
};

