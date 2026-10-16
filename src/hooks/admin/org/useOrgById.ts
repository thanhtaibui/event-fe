import { useCallback, useEffect, useRef, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useOrgById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const fetchOrgById = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!id) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setData(null);
      setError(null);
      setLoading(true);
      const res = await orgService.getOrgById(id);
      if (requestRef.current === requestId) setData(res.data);
    } catch (err) {
      if (requestRef.current === requestId) {
        setData(null);
        setError(err);
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrgById();
  }, [fetchOrgById]);
  return { data, loading, error, refetch: fetchOrgById };
}
