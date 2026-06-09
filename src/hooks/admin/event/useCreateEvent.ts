
import { useState } from 'react';
import type { EventPayload } from "../../../types/event/create";

import { eventService } from '../../../services/admin/event.service';

export const useCreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const createEvent = async (payload: EventPayload) => {
    try {

      setLoading(true)
      await eventService.createEvent(payload)
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

