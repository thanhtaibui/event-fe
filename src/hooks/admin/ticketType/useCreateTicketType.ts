import { useState } from "react";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { ticketTypeService } from "../../../services/admin/ticket-type.service";

export const useCreateTicketType = () => {
  const [loading, setLoading] = useState(false);

  const createTicketType = async (payload: TicketType) => {
    try {
      setLoading(true);
      await ticketTypeService.createTicketType(payload);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTicketType,
    loading,
  };
};

