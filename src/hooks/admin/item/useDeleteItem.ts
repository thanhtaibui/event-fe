
import { useRef, useState } from 'react';
import { itemService } from '../../../services/admin/item.service';

export const useDeleteItem = () => {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const deleteItem = async (id: string) => {
    if (loadingRef.current) return false;

    loadingRef.current = true;
    try {
      setLoading(true)
      await itemService.deleteItem(id)
      return true
    } catch (error) {
      return false
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }
  return {
    loading,
    deleteItem
  }

};

