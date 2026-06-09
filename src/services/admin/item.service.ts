import type { ItemPayload } from "../../types/item/payload";
import api from "../api";

export const itemService = {
  getItemOfEvent: async (id: string) => {
    const res = await api.get(`/items/${id}`);
    return res.data;
  },
  createItem: async (item: ItemPayload) => {
    const res = await api.post(`/items/`, item);
    return res.data;
  },
  updateItem: async (id: string, item: ItemPayload) => {
    const res = await api.patch(`/items/${id}`, item);
    return res.data;
  },
  deleteItem: async (id: string) => {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },
}