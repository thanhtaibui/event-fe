import "../../../styles/admin/event.css";
import "../../../styles/layout/table.css";

import LoadingPage from "../../LoadingPage";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
// import component
import { SearchBar } from "../../../components/table/SearchBar";
import Pagination from "../../../components/table/Pagination";
import CustomTable, { type Column } from "../../../components/table/Table";
import { PopupHideItems } from "../../../components/layout/PopupHideItems";
import ConfirmDialog from "../../../components/layout/DialogConfirm";
import type { EventDto } from "../../../types/event/event";
import { UseEvent } from "../../../hooks/admin/event/useEvent";
import { useDataTable } from "../../../hooks/admin/useDataTable";
import { usePageActions } from "../../../hooks/admin/usePageActions";

export default function Event() {
  const { data, loading, search, table, pagination, refetch } =
    useDataTable<EventDto>({
      fetchHook: UseEvent,
      // updateApi: orgService.updateActive,
    });

  const {
    popupType,
    setPopupType,
    onFinalDelete,
    // selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table);

  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };
  // setup column
  const eventColumns: Column<EventDto>[] = [
    {
      id: "title",
      label: "Event Name",
      render: (event: EventDto) => {
        return (
          <div className="event-content">
            <div className="img-event">
              <img src={event.eventPoster} alt="poster" />
            </div>
            <span>{event.title}</span>
          </div>
        );
      },
      sortable: true,
    },

    {
      id: "organization",
      label: "Organization",
      render: (row: EventDto) => {
        // Truy cập vào lồng bên trong OrgDto
        return row.organization?.name || "N/A";
      },
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      render: (row: EventDto) => {
        // Dùng giá trị enum từ EventStatus để lấy style
        const style =
          EVENT_STATUS_STYLES[row.status] || EVENT_STATUS_STYLES.UPCOMING;
        return (
          <span
            className="role-badge"
            style={{
              background: style.bg,
              color: style.text,
              border: style.border,
            }}
          >
            {row.status}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "capacity",
      label: "Capacity",
      render: (row: EventDto) => row.capacity.toLocaleString(),
      sortable: false,
    },
    {
      id: "actions",
      label: "Actions",
      render: (event: EventDto) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn-edit"
            onClick={() => {
              // Logic mở popup update cho event.id
              setPopupType("update");
              setSelectedIds([event.id]);
            }}
          >
            <img
              width="20"
              height="20"
              className="icon-white"
              src="https://img.icons8.com/nolan/64/pencil.png"
              alt="pencil"
            />
            <span className="text-edit">Edit</span>
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              setPopupType("confirm");
              setSelectedIds([event.id]);
            }}
          >
            <img
              width="20"
              height="20"
              className="icon-white"
              src="https://img.icons8.com/nolan/64/waste.png"
              alt="waste"
            />
            <span className="text-delete">Delete</span>
          </button>
        </div>
      ),
      sortable: false,
    },
  ];
  return (
    <div className="event-page">
      <ConfirmDialog
        open={popupType === "confirm"}
        onConfirm={onFinalDelete}
        onClose={() => setPopupType(null)}
      />
      <PopupHideItems
        title="Delete"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={() => {
          setPopupType("create");
        }}
        title="event"
      />
      {loading ? (
        <LoadingPage />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={eventColumns}
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
