import api from "../api";

export const permissionService = {
  getPermissions: async () => {
    const res = await api.get('permissions');
    return res.data;
  },
}