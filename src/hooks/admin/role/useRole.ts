import { useCallback, useEffect, useState } from "react";
import { roleService } from "../../../services/admin/role.service";
import type { Query } from "../../../types/query";

export const UseRole = (query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await roleService.getRoles(query);
      // console.log(res.data)
      setData(res.data);
    } catch (error) {
      console.error("Fetch roles error:", error);
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(query)])
  useEffect(() => {
    fetRoles();
  }, [fetRoles])
  return { data, loading, fetchData: fetRoles };
}