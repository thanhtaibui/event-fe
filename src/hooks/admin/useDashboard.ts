import { dashboardService } from "../../services/admin/dashboard.service";
import { useEffect, useState } from "react";

export const useDashboardInfo = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getDashboard();
        // console.log(res.data)
        setData(res.data);
      } catch (err) {
        console.error("Lỗi dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};