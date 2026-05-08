import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
} from "@mui/material";
import { useRef } from "react";
import useDragScroll from "../../hooks/table/useDragScroll";

export interface Column<T> {
  id: keyof T | "actions";
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}
interface CustomTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  selected: (string | number)[];
  onSelectOne: (id: string | number) => void;
  onSelectAll: (checked: boolean) => void;
  order: "asc" | "desc";
  orderBy: keyof T | "";
  onSort: (key: keyof T) => void;
}

export default function CustomTable<T extends { id: string | number }>({
  columns,
  rows,
  selected,
  onSelectOne,
  onSelectAll,
  order,
  orderBy,
  onSort,
}: CustomTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useDragScroll(containerRef);
  return (
    <TableContainer
      ref={containerRef}
      component={Paper}
      sx={{
        borderRadius: "16px",
        marginBottom: "20px",
        userSelect: "none",
        cursor: "grab",
      }}
      className="custom-table-container"
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  selected.length > 0 && selected.length < rows.length
                }
                checked={rows.length > 0 && selected.length === rows.length}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </TableCell>
            {columns.map((col) => (
              <TableCell key={String(col.id)}>
                {col.sortable ? (
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : "asc"}
                    onClick={() => onSort(col.id as keyof T)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} selected={selected.includes(row.id)}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.includes(row.id)}
                  onChange={() => onSelectOne(row.id)}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={String(col.id)}>
                  {col.render
                    ? col.render(row)
                    : (row[col.id as keyof T] as any)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
