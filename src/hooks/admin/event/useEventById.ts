import { useEffect, useState } from "react";
import { eventService } from "../../../services/admin/event.service";

export const useEventById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchEventById = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEventById(id);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventById();
  }, [id]);
  return { data, loading };
}