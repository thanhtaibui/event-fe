import type { Query } from "../../types/query";
import api from "../api";

export const reportService = {
  getReports: async (query?: Query) => {
    const res = await api.get('reports', { params: query });
    return res.data;
  },
}