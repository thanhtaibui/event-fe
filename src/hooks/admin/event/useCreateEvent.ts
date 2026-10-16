
import { useState } from 'react';
import type { EventPayload } from "../../../types/event/create";

import { eventService } from '../../../services/admin/event.service';
import { triggerNotification } from "../../notification/useNotificationTrigger";

export const useCreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const createEvent = async (payload: EventPayload) => {
    try {
      setLoading(true)
      const result = await eventService.createEvent(payload)
      await triggerNotification("EVENT_CREATED", { eventTitle: payload.title });
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    createEvent
  }

};

