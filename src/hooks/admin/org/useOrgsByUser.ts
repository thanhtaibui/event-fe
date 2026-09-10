import { useEffect, useState } from "react";
import { userService } from "../../../services/admin/user.service";

export const useOrgsByUser = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(id));

  const fetchOrgs = async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await userService.getOrgsByUser(id);
      setData(res?.data ?? res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [id]);

  return { data, loading };
};
