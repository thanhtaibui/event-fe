import { useCallback, useEffect, useState } from "react";
import { roleService } from "../../../services/admin/role.service";
import type { Query } from "../../../types/query";

export const UseOrgRole = (slug: string, query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await roleService.getRolesByOrgSlug(slug, query);
      setData(res.data);
    } catch (error) {
      console.error("Fetch org roles error:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, JSON.stringify(query)]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { data, loading, fetchData: fetchRoles };
};
