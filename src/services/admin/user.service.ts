import api from "../api";
import type { Query } from "../../types/query"
import type { CreateUser } from "../../types/user/create";
import type { UpdateUser } from "../../types/user/update";
export const userService = {
  getUsers: async (query?: Query) => {
    const res = await api.get('users', { params: query });
    return res.data;
  },
  getUserById: async (id: string) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  getOrgsByUser: async (userId: string) => {
    const res = await api.get(`/users/${userId}/organizations`);
    return res.data;
  },
  updateActive: async (id: string, active: boolean) => {
    const res = await api.patch(`users/${id}/active`, { active });
    return res.data;
  },
  deleteSort: async (ids: string[]) => {
    const res = await api.patch(`users/delete`, { ids: ids });
    return res.data;
  },
  createUser: async (createUser: CreateUser) => {
    const res = await api.post(`users`, createUser);
    return res.data;
  },
  updateUser: async (id: string, updateUser: UpdateUser) => {
    const res = await api.patch(`/users/${id}`, updateUser)
    return res.data;
  }
}
