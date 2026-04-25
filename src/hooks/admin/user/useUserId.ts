import { useEffect, useState } from "react";
import { userService } from "../../../services/admin/user.service";

export const useUserById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchUserById = async () => {
    try {
      setLoading(true);
      const res = await userService.getUserById(id);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserById();
  }, [id]);
  return { data, loading, };
}