import "../../../styles/admin/event.css";
import "../../../styles/admin/table/table.css";
import "../../../styles/admin/table/btn-action.css";

import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
// import component
import { SearchBar } from "../../../components/admin/table/SearchBar";
import Pagination from "../../../components/admin/table/Pagination";
import CustomTable, {
  type Column,
} from "../../../components/admin/table/Table";
import { PopupHideItems } from "../../../components/admin/layout/PopupHideItems";
import ConfirmDialog from "../../../components/admin/layout/DialogConfirm";
import type { EventDto } from "../../../types/event/event";
import { UseEvent } from "../../../hooks/admin/event/useEvent";
import { UseOrgEvent } from "../../../hooks/org/event/useEvent";
import { useDataTable } from "../../../hooks/admin/useDataTable";
import { usePageActions } from "../../../hooks/admin/usePageActions";
import { CreateEventPopup } from "../../../components/admin/event/createEvent";
import { useCancelled } from "../../../hooks/admin/event/useCancelled";
import { toast } from "react-toastify";
import { UpdateEventPopup } from "../../../components/admin/event/updateEvent";
import { useNavigate, useParams } from "react-router-dom";
import { encodeId } from "../../../utils/hash";
import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import {
  ADMIN_PERMISSION_CODES,
  canAccessAdminAction,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipSlug,
  hasPermission,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import { getAccessToken } from "../../../constants/authStorage";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import {
  CalendarDays,
  Clock3,
  Eye,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Radio,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";

const getEventStatusClass = (status?: string) =>
  `event-admin-status event-admin-status--${(status || "unknown").toLowerCase()}`;

const formatEventDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatEventTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Event() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isOrgWorkspace = Boolean(slug);
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);
  const { data: membershipData } = useOrgsByUser(
    isOrgWorkspace ? currentUserId : "",
  );
  const permissionCodes = useMemo(() => {
    if (!isOrgWorkspace || !slug) return getJwtPermissionCodes();

    const membership = normalizeUserMemberships(membershipData).find(
      (item) => getMembershipSlug(item) === slug,
    );

    return membership
      ? getEffectiveOrgPermissionCodes(membership)
      : new Set<string>();
  }, [isOrgWorkspace, membershipData, slug]);
  const canCreateEvent = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.EVENT,
    "create",
  );
  const canEditEvent = hasPermission(permissionCodes, ADMIN_PERMISSION_CODES.EVENT);
  const canDeleteEvent = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.EVENT,
    "delete",
  );

  const { data, loading, search, filter, table, pagination, refetch } =
    useDataTable<EventDto>({
      fetchHook: (query) =>
        isOrgWorkspace ? UseOrgEvent(slug || "", query) : UseEvent(query),
    });
  const { cancelledEvent, loading: cancellingEvent } = useCancelled();

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
    if (cancellingEvent || selectedIds.length === 0) return;

    try {
      const res = await cancelledEvent(selectedIds);
      await refetch?.();
      table.handleSelectAll(false, []);
      // console.log(res);
      toast.success(res.message);
      setPopupType(null);
      handleCloseAndClear();
    } catch {
      setPopupType(null);
    }
  };
  const events = data.items || [];
  const totalEvents = data.total || events.length;
  const activeEvents = events.filter((event) =>
    ["published", "upcoming", "ongoing"].includes(event.status)
  ).length;
  const draftEvents = events.filter((event) => event.status === "draft").length;
  const cancelledEvents = events.filter(
    (event) => event.status === "cancelled"
  ).length;

  // setup column
  const eventColumns: Column<EventDto>[] = [
    {
      id: "title",
      label: "Event",
      render: (event: EventDto) => {
        return (
          <div className="event-admin-cell">
            <div className="event-admin-thumb">
              <img
                src={event.eventBanner || "/default-banner.png"}
                alt={`${event.title} banner`}
              />
            </div>
            <div className="event-admin-cell__text">
              <strong title={event.title}>{event.title}</strong>
              <span title={event.place || "No location"}>
                <MapPin size={13} aria-hidden="true" />
                {event.place || "No location"}
              </span>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      id: "organization",
      label: "Organizer",
      render: (row: EventDto) => (
        <div className="event-admin-org">
          <strong title={row.organization?.name || "N/A"}>
            {row.organization?.name || "N/A"}
          </strong>
          {row.organization?.isVerified && <span>Verified organizer</span>}
        </div>
      ),
      sortable: false,
    },
    {
      id: "eventTime",
      label: "Date",
      render: (row: EventDto) => {
        return (
          <div className="event-admin-date">
            <CalendarDays size={15} aria-hidden="true" />
            <div>
              <strong>{formatEventDate(row.startDateTime)}</strong>
              <span>
                {formatEventTime(row.startDateTime)} -{" "}
                {formatEventTime(row.endDateTime)}
              </span>
            </div>
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "status",
      label: "Status",
      render: (row: EventDto) => {
        const style =
          EVENT_STATUS_STYLES[row.status] || EVENT_STATUS_STYLES.UPCOMING;
        return (
          <span
            className={getEventStatusClass(row.status)}
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
          <div className="event-admin-capacity">
            <div>
              <strong>{percentage}%</strong>
              <span>
                {sold.toLocaleString()}/{total.toLocaleString()}
              </span>
            </div>
            <div className="event-admin-progress">
              <div
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
        <div className="event-admin-actions">
          {canEditEvent && (
            <button
              className="event-admin-action event-admin-action--edit"
              onClick={() => {
                setPopupType("update");
                setSelectedIds([event.id]);
              }}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>Edit</span>
            </button>
          )}
          {canDeleteEvent && (
            <button
              className="event-admin-action event-admin-action--delete"
              onClick={() => {
                setPopupType("confirm");
                setSelectedIds([event.id]);
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete</span>
            </button>
          )}
          <button
            className="event-admin-action event-admin-action--view"
            onClick={() => {
              const basePath = isOrgWorkspace ? `/org/${slug}` : "/admin";
              navigate(`${basePath}/events/${encodeId(event.id)}`);
            }}
          >
            <Eye size={16} aria-hidden="true" />
            <span>View</span>
          </button>
        </div>
      ),
      sortable: false,
    },
  ];
  return (
    <div className="admin-page admin-page--events">
      <ConfirmDialog
        open={popupType === "confirm"}
        onConfirm={onFinalCancelled}
        onClose={() => setPopupType(null)}
        loading={cancellingEvent}
      />
      <PopupHideItems
        title="Cancelled"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      <section className="event-admin-hero">
        <div className="event-admin-hero__content">
          <span className="event-admin-eyebrow">
            <Radio size={16} aria-hidden="true" />
            Event Control Center
          </span>
          <h1>Admin Event Management</h1>
          <p>
            Quản lý sự kiện, trạng thái xuất bản, sức chứa và thao tác vận hành
            trong một giao diện gọn hơn.
          </p>
        </div>
        {canCreateEvent && (
          <button
            type="button"
            className="event-admin-primary-action"
            onClick={() => setPopupType("create")}
          >
            <Plus size={18} aria-hidden="true" />
            Create Event
          </button>
        )}
      </section>

      <section className="event-admin-summary" aria-label="Event summary">
        <article>
          <span className="event-summary-icon">
            <CalendarDays size={18} aria-hidden="true" />
          </span>
          <small>Total events</small>
          <strong>{totalEvents}</strong>
        </article>
        <article>
          <span className="event-summary-icon event-summary-icon--active">
            <Radio size={18} aria-hidden="true" />
          </span>
          <small>Active on this page</small>
          <strong>{activeEvents}</strong>
        </article>
        <article>
          <span className="event-summary-icon event-summary-icon--draft">
            <FileText size={18} aria-hidden="true" />
          </span>
          <small>Draft on this page</small>
          <strong>{draftEvents}</strong>
        </article>
        <article>
          <span className="event-summary-icon event-summary-icon--cancelled">
            <XCircle size={18} aria-hidden="true" />
          </span>
          <small>Cancelled on this page</small>
          <strong>{cancelledEvents}</strong>
        </article>
      </section>

      <section className="event-admin-panel">
        <div className="event-admin-panel__header">
          <div>
            <span>Event directory</span>
            <h2>Event list</h2>
          </div>
        </div>
        <SearchBar
          onSearchChange={onSearchChange}
          placeholder={["Title", " Org Name"]}
          title="event"
          filters={[
            {
              key: "capacity",
              placeholder: "Capacity",
              options: [
                { label: "< 100", value: "$lte:100" },
                { label: ">= 100", value: "$gte:100" },
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
      </section>
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
        <AdminSkeleton variant="table" rows={6} />
      ) : events.length === 0 ? (
        <section className="event-admin-empty">
          <span>
            <CalendarDays size={28} aria-hidden="true" />
          </span>
          <h3>No events found</h3>
          <p>Không có sự kiện nào khớp với tìm kiếm hoặc bộ lọc hiện tại.</p>
        </section>
      ) : (
        <>
          <div className="event-admin-table admin-table-shell">
            <CustomTable
              rows={events}
              columns={eventColumns}
              tableClassName="event-table-container"
              order={table.sortOrder}
              orderBy={table.sortBy}
              onSort={table.handleSort}
              selected={table.selected}
              onSelectOne={table.handleSelectOne}
              onSelectAll={(checked) => table.handleSelectAll(checked, events)}
            />
          </div>
          <div className="event-admin-mobile-list" aria-label="Event mobile list">
            {events.map((event) => {
              const style =
                EVENT_STATUS_STYLES[event.status] || EVENT_STATUS_STYLES.UPCOMING;
              const sold = event.soldTickets || 0;
              const total = event.capacity || 1;
              const percentage = Math.min(Math.round((sold / total) * 100), 100);
              return (
                <article className="event-admin-mobile-card" key={event.id}>
                  <img
                    src={event.eventBanner || "/default-banner.png"}
                    alt={`${event.title} banner`}
                  />
                  <div className="event-admin-mobile-card__body">
                    <div className="event-admin-mobile-card__top">
                      <div>
                        <h3>{event.title}</h3>
                        <span>{event.organization?.name || "N/A"}</span>
                      </div>
                      <span
                        className={getEventStatusClass(event.status)}
                        style={{
                          background: style.bg,
                          color: style.text,
                          border: style.border,
                        }}
                      >
                        {style.statusDot && <span className="status-dot"></span>}
                        {event.status}
                      </span>
                    </div>
                    <div className="event-admin-mobile-card__meta">
                      <span>
                        <Clock3 size={14} aria-hidden="true" />
                        {formatEventDate(event.startDateTime)}
                      </span>
                      <span>
                        <Ticket size={14} aria-hidden="true" />
                        {percentage}% capacity
                      </span>
                    </div>
                    <div className="event-admin-actions">
                      {canEditEvent && (
                        <button
                          className="event-admin-action event-admin-action--edit"
                          onClick={() => {
                            setPopupType("update");
                            setSelectedIds([event.id]);
                          }}
                        >
                          <Pencil size={16} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        className="event-admin-action event-admin-action--view"
                        onClick={() => {
                          const basePath = isOrgWorkspace ? `/org/${slug}` : "/admin";
                          navigate(`${basePath}/events/${encodeId(event.id)}`);
                        }}
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>View</span>
                      </button>
                      {canDeleteEvent && (
                        <button
                          className="event-admin-action event-admin-action--delete"
                          onClick={() => {
                            setPopupType("confirm");
                            setSelectedIds([event.id]);
                          }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
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
