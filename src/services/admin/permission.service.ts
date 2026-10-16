import api from "../api";

export const permissionService = {
  getSuperAdminPermissions: async () => {
    const res = await api.get("/permissions/super-admin");
    return res.data;
  },
  getOwnerPermissions: async () => {
    const res = await api.get("/permissions/owner");
    return res.data;
  },
};
