import { useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

export const useRolesOrg = () => {
  // const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRolesOrgs = async (id: string) => {
    try {
      setLoading(true);
      const res = await orgService.getRolesOrg(id);
      return res.data
      // setData(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchRolesOrgs };
};