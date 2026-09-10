import type { Query } from "../../types/query";
import type { ReportStatus } from "../../types/enum";
import api from "../api";

export const reportService = {
  getReports: async (query?: Query) => {
    const res = await api.get('reports', { params: query });
    return res.data;
  },
  getReportsByOrgSlug: async (slug: string, query?: Query) => {
    const res = await api.get(`/reports/org/${slug}`, { params: query });
    return res.data;
  },
  updateStatus: async (id: string, status: ReportStatus) => {
    const res = await api.patch(`reports/${id}`, { status });
    return res.data;
  },
}
