import { useEffect, useState } from "react";
import { reportService } from "../../../services/admin/report.service";
import type { Query } from "../../../types/query";

export const UseOrgReport = (slug: string, query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await reportService.getReportsByOrgSlug(slug, query);
      setData(res.data);
    } catch (error) {
      console.error("Fetch org reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [slug, JSON.stringify(query)]);

  return { data, loading, fetchData: fetchReports };
};
