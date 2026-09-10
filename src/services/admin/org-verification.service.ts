import api from "../api";
import type {
  CreateOrgVerificationPayload,
  UpdateOrgVerificationPayload,
} from "../../types/organization/verification";
import type { Query } from "../../types/query";

export const orgVerificationService = {
  create: async (payload: CreateOrgVerificationPayload) => {
    const res = await api.post("/org-verification", payload);
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

