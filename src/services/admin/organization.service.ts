import type { Query } from "../../types/query";
import api from "../api";

export const orgService = {
  getOrgs: async (query?: Query) => {
    const res = await api.get('organizations', { params: query });
    return res.data;
  },
  getSwitchOrgs: async () => {
    const res = await api.get('organizations/switch-org');
    return res.data;
  },
  getRolesOrg: async (orgId: string) => {
    const res = await api.get(`organizations/${orgId}/roles`);
    return res.data;
  },
}