
import { useState } from 'react';
import { itemService } from '../../../services/admin/item.service';

export const useDeleteItem = () => {
  const [loading, setLoading] = useState(false);
  const deleteItem = async (id: string) => {
    try {
      setLoading(true)
      await itemService.deleteItem(id)
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    deleteItem
  }

};

