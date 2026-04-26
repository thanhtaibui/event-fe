import type { Query } from "../../types/query";
import type { RolePayload } from "../../types/role/payload";
import api from "../api";

export const roleService = {
  getRoles: async (query?: Query) => {
    const res = await api.get('roles', { params: query });
    return res.data;
  },
  getRoleById: async (id: string) => {
    const res = await api.get(`/roles/${id}`);
    return res.data;
  },
  createRole: async (payload: RolePayload) => {
    console.log(payload)
    const res = await api.post('roles', payload);
    return res.data;
  },
  updateRole: async (id: string, payload: RolePayload) => {
    const res = await api.patch(`roles/${id}`, payload);
    return res.data;
  },
  deleteSort: async (ids: string[]) => {
    const res = await api.patch(`roles/delete`, { ids: ids });
    return res.data;
  },

}