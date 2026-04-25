import { useState, useEffect } from "react";
import { useTable } from "../table/useTable";
import { usePage } from "../table/usePage";
import { useSearchFilter } from "../table/useSearchBar";
import { useToggleActive } from "../table/useToggleActive";



type UseDataTableProps<T> = {
  fetchHook: (params: any) => {
    data: { items: T[], total: number };
    loading: boolean;
    fetchData?: () => void;
  };
  updateApi?: (id: string, value: boolean) => Promise<any>;
};

export function useDataTable<T extends { id: string; isActive?: boolean }>({
  fetchHook,
  updateApi,
}: UseDataTableProps<T>) {
  type LocalData<T> = {
    items: T[];
    total: number;
  };

  const [localData, setLocalData] = useState<LocalData<T>>({
    items: [],
    total: 0,
  });
  const { debouncedSearchQuery, handleSearchChange } = useSearchFilter();
  const table = useTable<T>();
  const { page, rowsPerPage, setPage, setRowsPerPage } = usePage();

  const { data, loading, fetchData } = fetchHook({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
    search: debouncedSearchQuery,
  });

  useEffect(() => {
    if (data) {
      setLocalData({
        items: data.items,
        total: data.total,
      });
    }
  }, [data]);

  // optimistic update
  const updateLocal = (id: string, value: boolean) => {
    setLocalData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, isActive: value } : item
      ),
    }));
  };

  const toggle = updateApi
    ? useToggleActive(updateApi, updateLocal)
    : null;

  return {
    data: localData,
    loading,

    search: {
      handleSearchChange,
    },

    table,
    refetch: fetchData,
    pagination: {
      page,
      rowsPerPage,
      setPage,
      setRowsPerPage,
    },
    actions: {
      toggleActive: toggle?.handleToggleActive,
      isUpdating: toggle?.isUpdating,
    },
  };
}