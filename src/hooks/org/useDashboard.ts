import { useEffect, useState } from "react";
import { dashboardService } from "../../services/admin/dashboard.service";

export const useOrgDashboardInfo = (slug?: string, enabled = true) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!enabled || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await dashboardService.getOrgDashboard(slug);
        setData(res.data);
      } catch (err) {
        console.error("Lỗi dashboard org:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, enabled]);

  return { data, loading };
};
