
import { useState } from 'react';
import type { EventPayload } from "../../../types/event/create";

import { eventService } from '../../../services/admin/event.service';
import { triggerNotification } from "../../notification/useNotificationTrigger";

export const useCreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const createEvent = async (payload: EventPayload) => {
    try {

      setLoading(true)
      await eventService.createEvent(payload)
      await triggerNotification("EVENT_CREATED", { eventTitle: payload.title });
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    createEvent
  }

};

