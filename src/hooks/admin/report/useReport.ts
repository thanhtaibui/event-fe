import { useEffect, useState } from "react";
import { reportService } from "../../../services/admin/report.service";
import type { Query } from "../../../types/query";

export const UseReport = (query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetReports = async () => {
    setLoading(true)
    try {
      const res = await reportService.getReports(query);
      // console.log(res.data)
      setData(res.data);
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetReports();
  }, [JSON.stringify(query)])
  return { data, loading };
}