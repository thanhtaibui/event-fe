import { useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useSwitchOrg = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchSwitchOrgs = async () => {
    try {
      setLoading(true);
      const res = await orgService.getSwitchOrgs();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSwitchOrgs();
  }, []);
  return { data, loading };
}