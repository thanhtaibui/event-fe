import { useState } from "react";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useUpdateTicketType = () => {
  const [loading, setLoading] = useState(false);

  const updateTicketType = async (id: string, payload: TicketType) => {
    try {
      setLoading(true);
      const res = await ticketTypeService.updateTicketType(id, payload);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateTicketType,
    loading,
  };
};

