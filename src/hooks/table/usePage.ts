import { useState } from "react";

export function usePage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  return {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  }
}
