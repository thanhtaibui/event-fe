import { useEffect, useState } from "react";
import { eventService } from "../../../services/admin/event.service";

export const useTicketTypeByIdEvent = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchTicketTypeById = async () => {
    try {
      setLoading(true);
      const res = await eventService.getTicketTypeById(id);
      // console.log("Ticket type data:", res.data);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicketTypeById();
  }, [id]);
  return { data, loading, refetch: fetchTicketTypeById };
}