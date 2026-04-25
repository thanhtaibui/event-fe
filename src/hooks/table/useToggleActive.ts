import { useState } from 'react';
import { toast } from 'react-toastify';

export const useToggleActive = (apiFunction: (id: string, active: boolean,) => Promise<any>, onUpdate: (id: string, value: boolean) => void) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleActive = async (id: string, active: boolean) => {
    const prevValue = !active;

    onUpdate(id, active);
    setIsUpdating(true);
    try {
      await apiFunction(id, active);
      toast.success("Update Active Successfully");
    } catch (err) {
      onUpdate(id, prevValue);
    } finally {
      setIsUpdating(false);
    }
  };

  return { handleToggleActive, isUpdating };
};