
import { useState } from 'react';
import { itemService } from '../../../services/admin/item.service';
import type { ItemPayload } from '../../../types/item/payload';

export const useCreateItem = () => {
  const [loading, setLoading] = useState(false);
  const createItem = async (payload: ItemPayload) => {
    try {
      setLoading(true)
      await itemService.createItem(payload)
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    createItem
  }

};

