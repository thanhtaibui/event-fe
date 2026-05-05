import type { Query } from "../../types/query";
import type { PayloadOrganizationDto } from "../../types/organization/create";
import api from "../api";

export const orgService = {
  getOrgs: async (query?: Query) => {
    const res = await api.get('organizations', { params: query });
    return res.data;
  },
  getOrgById: async (id: string) => {
    const res = await api.get(`organizations/${id}`);
    return res.data;
  },
  getOrgBySlug: async (slug: string) => {
    const res = await api.get(`organizations/detail/${slug}`);
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
  createOrg: async (createOrg: PayloadOrganizationDto) => {
    const res = await api.post('organizations', createOrg);
    return res.data;
  },
  updateOrg: async (id: string, updateOrg: PayloadOrganizationDto) => {
    const res = await api.patch(`organizations/${id}`, updateOrg);
    return res.data;
  },
  updateActive: async (id: string, active: boolean) => {
    const res = await api.patch(`organizations/${id}/active`, { active });
    return res.data;
  },
  updateBanner: async (id: string, bannerUrl: string) => {
    const res = await api.patch(`organizations/${id}/banner`, { bannerUrl });
    return res.data;
  },
  deleteSort: async (ids: string[]) => {
    // console.log(ids)
    const res = await api.patch(`organizations/delete`, { ids: ids });
    return res.data;
  },

}
