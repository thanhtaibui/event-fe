import { useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useSwitchOrg = (enabled = true) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(enabled);
  const fetchSwitchOrgs = async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }

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
  }, [enabled]);
  return { data, loading };
}
