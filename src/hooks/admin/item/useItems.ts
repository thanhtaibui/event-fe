import { useEffect, useState } from "react";
import { itemService } from "../../../services/admin/item.service";

export const useItems = (id: string) => {
  const [data, setData] = useState<any>([]);
  const fetchItems = async () => {
    try {
      const res = await itemService.getItemOfEvent(id)
      // console.log(res.data)
      setData(res.data)
      return res.data;
    } catch (error) {

    }
  };
  useEffect(() => {
    fetchItems();
  }, []);
  return { data, fetchItems };
}