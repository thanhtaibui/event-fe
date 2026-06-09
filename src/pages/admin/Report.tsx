import Pagination from "../../components/admin/table/Pagination";
import { PopupHideItems } from "../../components/admin/layout/PopupHideItems";
import { SearchBar } from "../../components/admin/table/SearchBar";
import CustomTable, { type Column } from "../../components/admin/table/Table";
import LoadingPage from "../LoadingPage";
import { UseReport } from "../../hooks/admin/report/useReport";
import { useDataTable } from "../../hooks/admin/useDataTable";
// import { useState } from "react";
import type { Report } from "../../types/report/report";
import { STATUS_STYLES } from "../../styles/status-styles";
export default function Report() {
  const { data, loading, search, table, pagination } = useDataTable<Report>({
    fetchHook: UseReport,
    // updateApi: userService.updateActive,
  });
  const handleDelete = async () => {};

  const handleCloseAndClear = () => {
    handleDelete;
    table.handleSelectAll(false, []);
  };
  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const reportColumns: Column<Report>[] = [
    {
      id: "user",
      label: "User Name",
      render: (row) => row.user?.fullName,
      sortable: false,
    },
    {
      id: "organization",
      label: "Organization Name",
      render: (row) => row.organization?.name,
      sortable: false,
    },
    {
      id: "status",
      label: "Status",
      render: (row: Report) => {
        const statusKey = row.status?.toUpperCase() || "PENDING";
        const styleStatus =
          STATUS_STYLES[statusKey] || STATUS_STYLES["PENDING"];
        return (
          <span
            className="role-badge"
            style={{
              background: styleStatus.bg,
              color: styleStatus.text,
              border: `1px solid ${styleStatus.border}`,
            }}
          >
            {row.status.toLowerCase()}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "reason",
      label: "Reason",
      sortable: false,
    },
    {
      id: "createAt",
      label: "Create date",
      sortable: false,
      render: (row: any) => formatDate(row.createAt),
    },
  ];
  return (
    <div className="report">
      <PopupHideItems
        title="Spam"
        count={data.items.length}
        show={table.selected.length > 0}
        onConfirm={handleDelete}
        onClose={() => handleCloseAndClear()}
      />

      <SearchBar
        onSearchChange={onSearchChange}
        title="user"
        placeholder={["user"]}
      />

      {loading ? (
        <LoadingPage />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={reportColumns}
            order={table.sortOrder}
            orderBy={table.sortBy}
            onSort={table.handleSort}
            selected={table.selected}
            onSelectOne={table.handleSelectOne}
            onSelectAll={(checked) =>
              table.handleSelectAll(checked, data.items || [])
            }
          />
          <Pagination
            totalCount={data.total || 0}
            page={pagination.page}
            onPageChange={(_, newPage) => pagination.setPage(newPage)}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              pagination.setRowsPerPage(newLimit);
              pagination.setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
}
