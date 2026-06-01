import { useEffect, useState } from "react";
import { eventService } from "../../../services/admin/event.service";

export const useInviteByIdEvent = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchInviteById = async () => {
    try {
      setLoading(true);
      const res = await eventService.getInviteById(id);
      // console.log("Invite data:", res.data);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInviteById();
  }, [id]);
  return { data, loading, refetch: fetchInviteById };
}