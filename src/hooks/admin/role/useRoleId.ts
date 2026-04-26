
import { useEffect, useState } from "react";
import { roleService } from "../../../services/admin/role.service";

export const useRoleById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchRoleById = async () => {
    try {
      setLoading(true);
      const res = await roleService.getRoleById(id);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleById();
  }, [id]);
  return { data, loading };
}