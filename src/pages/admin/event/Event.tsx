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
import DashboardCard from "../../../components/dashboard/DashboardCard";
import { CreateEventPopup } from "../../../components/event/createEvent";
import { useCancelled } from "../../../hooks/admin/event/useCancelled";
import { toast } from "react-toastify";
import { UpdateEventPopup } from "../../../components/event/updateEvent";
import { useNavigate } from "react-router-dom";

export default function Event() {
  const navigate = useNavigate();

  const { data, loading, search, filter, table, pagination, refetch } =
    useDataTable<EventDto>({
      fetchHook: UseEvent,
      // updateApi: orgService.updateActive,
    });
  const { cancelledEvent } = useCancelled();

  const {
    popupType,
    setPopupType,
    // onFinalDelete,
    selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table);

  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };
  const onFinalCancelled = async () => {
    try {
      const res = await cancelledEvent(selectedIds);
      await refetch?.();
      table.handleSelectAll(false, []);
      // console.log(res);
      toast.success(res.message);
      setPopupType(null);
      handleCloseAndClear();
    } catch (error) {
      setPopupType(null);

      // console.error("Cancelled Failed", error);
    }
  };
  // setup column
  const eventColumns: Column<EventDto>[] = [
    {
      id: "title",
      label: "Event Name",
      render: (event: EventDto) => {
        return (
          <div className="event-content" style={{ whiteSpace: "normal" }}>
            <div className="img-event">
              <img src={event.eventPoster} alt="poster" />
            </div>
            <div className="event-right">
              <span>{event.title}</span>
              <span className="org-name">{event.organization.name}</span>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    // {
    //   id: "organization",
    //   label: "Organization",
    //   render: (row: EventDto) => {
    //     // Truy cập vào lồng bên trong OrgDto
    //     return row.organization?.name || "N/A";
    //   },
    //   sortable: true,
    // },
    {
      id: "eventTime",
      label: "Time",
      render: (row: EventDto) => {
        const start = new Date(row.startDateTime);
        const end = new Date(row.endDateTime);

        const format = (date: Date) =>
          `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate()}/${date.getMonth() + 1}`;

        return (
          <div
            style={{
              fontSize: "14px",
              color: "#858f9d",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            <span style={{ fontWeight: "500" }}>{format(start)}</span>
            <span style={{ margin: "0 4px", color: "#9CA3AF" }}>-</span>
            <span style={{ fontWeight: "500" }}>{format(end)}</span>
          </div>
        );
      },
      sortable: false,
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
            {style.statusDot && <span className="status-dot"></span>}
            {row.status}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "capacity",
      label: "Capacity",
      render: (row: EventDto) => {
        const sold = row.soldTickets || 0;
        const total = row.capacity || 1;
        // Tính phần trăm lấp đầy
        const percentage = Math.min(Math.round((sold / total) * 100), 100);

        return (
          <div className="capacity-container" style={{ userSelect: "none" }}>
            <div className="content-top">
              <div className="capacity-percent">{percentage}</div>{" "}
              <span className="capacity-text">
                {sold.toLocaleString()}/{total.toLocaleString()}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
      sortable: true,
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
          <button
            className="btn-detail"
            onClick={() => {
              const shortId = btoa(event.id).slice(0, 10);
              navigate(`/admin/events/${shortId}`);
            }}
          >
            <img
              width="64"
              height="64"
              className="icon-white"
              src="https://img.icons8.com/nolan/64/fine-print.png"
              alt="fine-print"
            />

            <span className="text-detail">Detail</span>
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
        onConfirm={onFinalCancelled}
        onClose={() => setPopupType(null)}
      />
      <PopupHideItems
        title="Cancelled"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      <div className="event__cards">
        <DashboardCard
          title="Total Members"
          value="100"
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/gender-neutral-user.png"
              alt="members"
            />
          }
        />
        <DashboardCard
          title="Total Events"
          value="100"
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/today.png"
              alt="events"
            />
          }
        />
        <DashboardCard
          title="Status"
          value="100"
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/ok.png"
              alt="status"
            />
          }
        />
      </div>
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={() => {
          setPopupType("create");
        }}
        placeholder={["Title", " Org Name"]}
        title="event"
        filters={[
          {
            key: "capacity",
            placeholder: "Capacity",
            options: [
              { label: "< 100", value: "$lte:100" },
              { label: "100 - 500", value: "$gte:100" },
              { label: "> 500", value: "$gte:500" },
              { label: "> 1000", value: "$gte:1000" },
            ],
          },
          {
            key: "status",
            placeholder: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Upcoming", value: "upcoming" },
              { label: "Ongoing", value: "ongoing" },
              { label: "Ended", value: "ended" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
        onFilterChange={filter.handleFilterChange}
      />
      {popupType === "update" && (
        <UpdateEventPopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "create" && (
        <CreateEventPopup
          onClose={() => setPopupType(null)}
          onSuccess={() => refetch?.()}
        />
      )}

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
