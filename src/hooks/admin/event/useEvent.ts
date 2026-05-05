import { useCallback, useEffect, useState } from "react";
import type { Query } from "../../../types/query";
import { eventService } from "../../../services/admin/event.service";

export const UseEvent = (query: Query) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventService.getEvents(query);
      // console.log(res.data)
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  return { data, loading, fetchData: fetchEvents };
}