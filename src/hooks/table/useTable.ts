import { useState } from "react";

export function useTable<T extends { id: string | number }>() {

  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<keyof T | "">("");
  // Logic chọn tất cả
  const handleSelectAll = (checked: boolean, rows: T[]) => {
    if (checked) {
      setSelected(rows.map((r) => r.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string | number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key: keyof T) => {
    const isAsc = sortBy === key && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortBy(key);
  };

  return {
    selected,
    handleSelectAll,
    handleSelectOne,
    sortOrder,
    sortBy,
    handleSort,
  };
}