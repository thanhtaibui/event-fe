import { useState } from "react";
import type { EventPayload } from "../../../types/event/create";
import { eventService } from "../../../services/admin/event.service";
import { triggerNotification } from "../../notification/useNotificationTrigger";

export const useUpdateEvent = () => {
  const [loading, setLoading] = useState(false);

  const updateEvent = async (id: string, payload: EventPayload) => {
    try {
      setLoading(true);
      const res = await eventService.updateEvent(id, payload);
      void triggerNotification("EVENT_UPDATED", { eventTitle: payload.title }).catch((notifErr) => {
        console.warn("[useUpdateEvent] triggerNotification failed:", notifErr);
      });
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateEvent,
    loading,
  };
};
