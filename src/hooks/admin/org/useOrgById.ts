import { useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useOrgById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchOrgById = async () => {
    try {
      setLoading(true);
      const res = await orgService.getOrgById(id);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgById();
  }, [id]);
  return { data, loading };
}