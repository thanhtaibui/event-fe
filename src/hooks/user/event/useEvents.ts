import { useCallback, useEffect, useState } from "react";

import { eventService } from "../../../services/admin/event.service";
import type { EventDto } from "../../../types/event/event";
import type { Query } from "../../../types/query";

type EventListResponse = {
  items: EventDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const useEvents = (query?: Query) => {
  const [data, setData] = useState<EventListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await eventService.getEvents(query);
      setData(res.data);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    data,
    events: data?.items ?? [],
    loading,
    error,
    refetch: fetchEvents,
  };
};
