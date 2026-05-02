import { useCallback, useEffect, useState } from "react";
import { userService } from "../../../services/admin/user.service";
import type { Query } from "../../../types/query"

export const useUser = (query?: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers(query);
      // console.log(res)
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  return { data, loading, fetchData: fetchUsers, };
}