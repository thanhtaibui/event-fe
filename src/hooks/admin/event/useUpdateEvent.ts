import { useState } from "react";
import type { EventPayload } from "../../../types/event/create";
import { eventService } from "../../../services/admin/event.service";

export const useUpdateEvent = () => {
  const [loading, setLoading] = useState(false);

  const updateEvent = async (id: string, payload: EventPayload) => {
    try {
      setLoading(true);
      await eventService.updateEvent(id, payload);
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateEvent,
    loading,
  };
};

