import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

export const useToggleActive = (apiFunction: (id: string, active: boolean,) => Promise<any>,
  onUpdate: (id: string, value: boolean) => void,
  refetch?: () => void,) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const updatingRef = useRef(false);

  const handleToggleActive = async (id: string, active: boolean) => {
    if (isUpdating || updatingRef.current) return;

    const prevValue = !active;

    updatingRef.current = true;
    onUpdate(id, active);
    setIsUpdating(true);
    try {
      await apiFunction(id, active);
      toast.success("Update Active Successfully");
      refetch?.();
    } catch (err) {
      onUpdate(id, prevValue);
    } finally {
      updatingRef.current = false;
      setIsUpdating(false);
    }
  };

  return { handleToggleActive, isUpdating };
};
