import { useCallback, useEffect, useRef, useState } from "react";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useTicketTypeById = (id: string) => {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const fetchTicketTypeById = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!id) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setData(null);
      setError(null);
      setLoading(true);
      const res = await ticketTypeService.getTicketTypeById(id);
      if (requestRef.current === requestId) setData(res.data);
    } catch (error) {
      console.error("Error fetching ticket type by ID:", error);
      if (requestRef.current === requestId) {
        setData(null);
        setError(error);
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchTicketTypeById();
  }, [fetchTicketTypeById]);
  return { data, loading, error, refetch: fetchTicketTypeById };

}
