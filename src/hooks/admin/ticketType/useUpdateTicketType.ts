import { useState } from "react";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useUpdateTicketType = () => {
  const [loading, setLoading] = useState(false);

  const updateTicketType = async (id: string, payload: TicketType) => {
    try {
      setLoading(true);
      await ticketTypeService.updateTicketType(id, payload);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateTicketType,
    loading,
  };
};

