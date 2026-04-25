// src/hooks/useSearchFilter.ts
import { useState, useCallback } from 'react';
import { useDebounce } from '../useDebounce';

export const useSearchFilter = (initialValue: string = '', delay: number = 200) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  const debouncedSearchQuery = useDebounce(searchQuery, delay);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return {
    searchQuery,
    debouncedSearchQuery,
    handleSearchChange,
  };
};