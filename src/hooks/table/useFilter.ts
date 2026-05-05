import { useState } from "react";

export function useFilter<T extends Record<string, string>>(initial: T) {
  const [filter, setFilter] = useState<T>(initial);

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const resetFilter = () => setFilter(initial);

  return { filter, handleFilterChange, resetFilter };
}