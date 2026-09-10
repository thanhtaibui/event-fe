import { dashboardService } from "../../services/admin/dashboard.service";
import { useEffect, useState } from "react";

export const useDashboardInfo = (enabled = true) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

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
  }, [enabled]);

  return { data, loading };
};
