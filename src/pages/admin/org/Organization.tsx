import "../../../styles/layout/table.css";

import LoadingPage from "../../LoadingPage";
import FormControlLabel from "@mui/material/FormControlLabel";
import { STATUS_STYLES } from "../../../styles/status-styles";
// import component
import { IOSSwitch } from "../../../components/table/Switch";
import { SearchBar } from "../../../components/table/SearchBar";
import Pagination from "../../../components/table/Pagination";
import CustomTable from "../../../components/table/Table";
import type { Column } from "../../../components/table/Table";
import { PopupHideItems } from "../../../components/layout/PopupHideItems";
import ConfirmDialog from "../../../components/layout/DialogConfirm";
//  hook
import { useDataTable } from "../../../hooks/admin/useDataTable";
import { useOrg } from "../../../hooks/admin/org/useOrg";
import { usePageActions } from "../../../hooks/admin/usePageActions";
import type { Organization } from "../../../types/organization/organization";
import { CreateOrgPopup } from "../../../components/org/createOrg";
import { UpdateOrgPopup } from "../../../components/org/updateOrg";
import { orgService } from "../../../services/admin/organization.service";
import { useDelete } from "../../../hooks/admin/org/useDelete";
import { useNavigate } from "react-router-dom";

export default function Organization() {
  const navigate = useNavigate();
  const { data, loading, search, table, pagination, actions, refetch } =
    useDataTable<Organization>({
      fetchHook: useOrg,
      updateApi: orgService.updateActive,
    });
  const { deleteSort } = useDelete();

  const {
    popupType,
    setPopupType,
    onFinalDelete,
    selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table, deleteSort);

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
  // setup column
  const orgColumns: Column<Organization>[] = [
    { id: "name", label: "Organization Name", sortable: true },
    {
      id: "owner",
      label: "owner",
      render: (org: Organization) => {
        return org.owner?.fullName;
      },
      sortable: false,
    },
    { id: "slug", label: "Slug", sortable: false },
    // {
    //   id: "bio",
    //   label: "bio",
    //   render: (org: Organization) => {
    //     if (!org.bio) return <i>No description</i>;
    //     return (
    //       <div className="table-textarea">
    //         <textarea
    //           name="bio"
    //           rows={4}
    //           value={org.bio}
    //           className="form-control-textarea"
    //         />
    //       </div>
    //     );
    //   },
    //   sortable: false,
    // },
    {
      id: "createdAt",
      label: "created At",
      render: (org: Organization) => {
        return (
          <span style={{ userSelect: "none" }}>
            {formatDate(org.createdAt.toString())}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "status",
      label: "Status",
      render: (org: Organization) => {
        // Dùng cái mapping mà chúng ta đã nói ở trên
        const style = STATUS_STYLES[org.status] || STATUS_STYLES.SPAM;
        return (
          <span
            className="role-badge"
            style={{
              background: style.bg,
              color: style.text,
              border: `1px solid ${style.border}`,
            }}
          >
            {org.status}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "isActive",
      label: "Active",
      render: (org: Organization) => (
        <FormControlLabel
          control={
            <IOSSwitch
              sx={{ m: 1 }}
              checked={org.isActive}
              disabled={actions.isUpdating}
              onChange={(e) => actions.toggleActive?.(org.id, e.target.checked)}
            />
          }
          label=""
        />
      ),
      sortable: false,
    },
    {
      id: "actions",
      label: "Actions",
      render: (org) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn-edit"
            onClick={() => {
              setPopupType("update");
              setSelectedIds([org.id]);
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
              setSelectedIds([org.id]);
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
              navigate(`/admin/organizations/${org.slug}`);
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
    <div>
      <ConfirmDialog
        open={popupType === "confirm"}
        onConfirm={() => onFinalDelete()}
        onClose={() => setPopupType(null)}
      />
      <PopupHideItems
        title="Delete"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      {popupType === "create" && (
        <CreateOrgPopup
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "update" && (
        <UpdateOrgPopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={() => {
          setPopupType("create");
        }}
        title="organization"
      />
      {loading ? (
        <LoadingPage />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={orgColumns}
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
