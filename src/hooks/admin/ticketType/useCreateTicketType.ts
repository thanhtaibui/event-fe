import { useState } from "react";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useCreateTicketType = () => {
  const [loading, setLoading] = useState(false);

  const createTicketType = async (payload: TicketType) => {
    try {
      setLoading(true);
      const res = await ticketTypeService.createTicketType(payload);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTicketType,
    loading,
  };
};

