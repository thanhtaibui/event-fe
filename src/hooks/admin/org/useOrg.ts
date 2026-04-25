import { useEffect, useState } from "react";
import { userService } from "../../../services/admin/user.service";

export const useOrg = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await userService.getOrgsByUser(id);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgs();
  }, []);
  return { data, loading };
}