
import { useState } from 'react';
import { itemService } from '../../../services/admin/item.service';
import type { ItemPayload } from '../../../types/item/payload';

export const useUpdateItem = () => {
  const [loading, setLoading] = useState(false);
  const updateItem = async (id: string, payload: ItemPayload) => {
    try {
      setLoading(true)
      await itemService.updateItem(id, payload)
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    updateItem
  }

};

