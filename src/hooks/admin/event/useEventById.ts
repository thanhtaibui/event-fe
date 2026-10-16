import { useCallback, useEffect, useRef, useState } from "react";
import { eventService } from "../../../services/admin/event.service";

export const useEventById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const fetchEventById = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!id || id === "----") {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setData(null);
      setError(null);
      setLoading(true);
      const res = await eventService.getEventById(id);
      if (requestRef.current === requestId) {
        const eventData = res?.data?.id ? res.data : (res?.id ? res : (res?.data ?? res));
        setData(eventData);
      }
    } catch (err) {
      if (requestRef.current === requestId) {
        setData(null);
        setError(err);
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventById();
  }, [fetchEventById]);
  return { data, loading, error, refetch: fetchEventById };
}
