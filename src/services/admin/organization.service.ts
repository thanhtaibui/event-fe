import type { Query } from "../../types/query";
import type { PayloadOrganizationDto } from "../../types/organization/create";
import type { OrgRequestStatus } from "../../types/enum";
import type {
  UpsertOrganizationPaymentAccountDto,
  OrganizationPaymentAccountResponse,
  LookupOrganizationPaymentAccountDto,
  LookupOrganizationPaymentAccountResponse,
} from "../../types/organization/organization";
import api from "../api";

export const orgService = {
  getOrgs: async (query?: Query) => {
    const res = await api.get('/organizations/management', { params: query });
    return res.data;
  },
  getPublicOrganizations: async (query?: Query) => {
    const res = await api.get('/organizations', { params: query });
    return res.data;
  },
  getOrgById: async (id: string) => {
    const res = await api.get(`organizations/${id}`);
    return res.data;
  },
  getOrgBySlug: async (slug: string) => {
    const res = await api.get(`/organizations/detail/${slug}`);
    return res.data;
  },
  getPublicOrgBySlug: async (slug: string) => {
    const res = await api.get(`/organizations/public-detail/${slug}`);
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
  approveOrganization: async (id: string) => {
    const res = await api.patch(`organizations/${id}/approve`);
    return res.data;
  },
  updateStatus: async (id: string, status: OrgRequestStatus) => {
    const res = await api.patch(`organizations/${id}/status`, { status });
    return res.data;
  },
  updateBanner: async (id: string, bannerUrl: string) => {
    const res = await api.patch(`organizations/${id}/banner`, { bannerUrl });
    return res.data;
  },
  updateLogo: async (id: string, logoUrl: string) => {
    try {
      const res = await api.patch(`organizations/${id}/logo`, { logoUrl });
      return res.data;
    } catch {
      const res = await api.patch(`organizations/${id}`, { logoUrl } as any);
      return res.data;
    }
  },
  deleteSort: async (ids: string[]) => {
    // console.log(ids)
    const res = await api.patch(`organizations/delete`, { ids: ids });
    return res.data;
  },
  getPaymentAccount: async (organizationId: string): Promise<OrganizationPaymentAccountResponse> => {
    const res = await api.get(`/organizations/${organizationId}/payment-account`, {
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },
  lookupPaymentAccount: async (
    organizationId: string,
    payload: LookupOrganizationPaymentAccountDto,
  ): Promise<LookupOrganizationPaymentAccountResponse> => {
    const res = await api.post(`/organizations/${organizationId}/payment-account/lookup`, payload, {
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },
  updatePaymentAccount: async (
    organizationId: string,
    payload: UpsertOrganizationPaymentAccountDto,
  ): Promise<OrganizationPaymentAccountResponse> => {
    const res = await api.put(`/organizations/${organizationId}/payment-account`, payload, {
      skipGlobalToast: true,
    } as any);
    return res.data?.data ?? res.data;
  },
};
