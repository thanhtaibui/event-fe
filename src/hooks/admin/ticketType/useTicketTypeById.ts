import { useEffect, useState } from "react";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useTicketTypeById = (id: string) => {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchTicketTypeById = async () => {
    try {
      setLoading(true);
      const res = await ticketTypeService.getTicketTypeById(id);
      console.log("Ticket type data:", res.data);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching ticket type by ID:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTicketTypeById();
  }, [id]);
  return { data, loading, refetch: fetchTicketTypeById };

}
