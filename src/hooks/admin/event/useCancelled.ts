import { useRef, useState } from "react";
import { eventService } from "../../../services/admin/event.service";
import { triggerNotification } from "../../notification/useNotificationTrigger";

export const useCancelled = () => {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const cancelledEvent = async (ids: string[]) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    try {
      setLoading(true)
      const res = await eventService.cancelledEvent(ids)
      await triggerNotification("EVENT_CANCELLED", { count: ids.length });
      // console.log(res)
      return res
    } catch (error) {
      // return false
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }
  return {
    loading,
    cancelledEvent
  }
}
