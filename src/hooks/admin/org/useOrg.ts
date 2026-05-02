import { useCallback, useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";
import type { Query } from "../../../types/query"

export const useOrg = (query?: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orgService.getOrgs(query);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);
  return { data, loading, fetchData: fetchOrgs, };
}