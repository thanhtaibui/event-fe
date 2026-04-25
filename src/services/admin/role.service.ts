import type { Query } from "../../types/query";
import type { Role } from "../../types/role/role";
import api from "../api";

export const roleService = {
  getRoles: async (query?: Query) => {
    const res = await api.get('roles', { params: query });
    return res.data;
  },
  createRole: async (role: Role) => {
    const { id, ...body } = role
    console.log(role)
    const res = await api.post('roles', body);
    return res.data;
  },
}