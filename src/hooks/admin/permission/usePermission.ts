import { useEffect, useState } from "react";
import { permissionService } from "../../../services/admin/permission.service";

export const UsePermission = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetPermissions = async () => {
    setLoading(true)
    try {
      const res = await permissionService.getPermissions();
      // console.log(res.data)
      setData(res.data);
    } catch (error) {
      console.error("Fetch permissions error:", error);
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetPermissions();
  }, [])
  return { data, loading };
}
