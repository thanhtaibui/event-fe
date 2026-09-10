import { useCallback, useEffect, useState } from "react";
import { eventService } from "../../../services/admin/event.service";
import type { Query } from "../../../types/query";

export const UseOrgEvent = (slug: string, query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await eventService.getEventsByOrgSlug(slug, query);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [slug, JSON.stringify(query)]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { data, loading, fetchData: fetchEvents };
};
