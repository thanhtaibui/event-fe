import api from "../api";

export const dashboardService = {
  getDashboard: async () => {
    const res = await api.get("/dashboard");
    return res.data;
  },
  getOrgDashboard: async (slug: string) => {
    const res = await api.get(`/dashboard/org/${slug}`);
    return res.data;
  },
};
