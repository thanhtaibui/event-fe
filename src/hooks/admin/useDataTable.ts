import { useState, useEffect } from "react";
import { useTable } from "../table/useTable";
import { usePage } from "../table/usePage";
import { useSearchFilter } from "../table/useSearchBar";
import { useToggleActive } from "../table/useToggleActive";
import { useFilter } from "../table/useFilter";



type UseDataTableProps<T> = {
  fetchHook: (params: any) => {
    data: { items: T[], total: number };
    loading: boolean;
    fetchData?: () => void;
  };
  updateApi?: (id: string, value: boolean) => Promise<any>;
  initialFilter?: Record<string, string>;
};

export function useDataTable<T extends { id: string; isActive?: boolean }>({
  fetchHook,
  updateApi,
  initialFilter = {},
}: UseDataTableProps<T>) {
  type LocalData<T> = {
    items: T[];
    total: number;
  };
  const { filter, handleFilterChange } = useFilter(initialFilter);
  const [localData, setLocalData] = useState<LocalData<T>>({
    items: [],
    total: 0,
  });
  const filterParams = Object.entries(filter).reduce((acc, [key, value]) => {
    if (value) acc[`filter.${key}`] = `$eq:${value}`;
    return acc;
  }, {} as Record<string, string>);
  const { debouncedSearchQuery, handleSearchChange } = useSearchFilter();
  const table = useTable<T>();
  const { page, rowsPerPage, setPage, setRowsPerPage } = usePage();

  const { data, loading, fetchData } = fetchHook({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: table.sortQuery,
    search: debouncedSearchQuery,
    ...filterParams
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
    ? useToggleActive(updateApi, updateLocal, fetchData)
    : null;

  return {
    data: localData,
    loading,

    search: {
      handleSearchChange,
    },
    filter: { handleFilterChange },
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