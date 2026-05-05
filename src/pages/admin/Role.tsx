import Pagination from "../../components/table/Pagination";
import { PopupHideItems } from "../../components/layout/PopupHideItems";
import { SearchBar } from "../../components/table/SearchBar";
import CustomTable, { type Column } from "../../components/table/Table";
import LoadingPage from "../LoadingPage";
import { UseRole } from "../../hooks/admin/role/useRole";
import { useDataTable } from "../../hooks/admin/useDataTable";
import type { Role } from "../../types/role/role";
import "../../styles/layout/table.css";
// import { useState } from "react";
import { ROLE_COLOR_PALETTE } from "../../styles/status-styles";
import { CreateRolePopup } from "../../components/role/createRole";
import ConfirmDialog from "../../components/layout/DialogConfirm";
import { usePageActions } from "../../hooks/admin/usePageActions";
import { UpdateRolePopup } from "../../components/role/updateRole";
import { useDelete } from "../../hooks/admin/role/useDelete";
export default function Role() {
  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };

  const { data, loading, search, table, pagination, refetch } =
    useDataTable<Role>({
      fetchHook: UseRole,
      // updateApi: userService.updateActive,
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

  const reportColumns: Column<Role>[] = [
    {
      id: "role_name",
      label: "Role Name",
      render: (r) => {
        const styteRole =
          ROLE_COLOR_PALETTE[r.colorKey as keyof typeof ROLE_COLOR_PALETTE] ||
          ROLE_COLOR_PALETTE.gray;
        return (
          <span
            className="role-badge"
            style={{
              userSelect: "none",
              background: styteRole.bg,
              color: styteRole.text,
              border: styteRole.border,
            }}
          >
            {r.role_name}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "role_code",
      label: "Role Code",
      sortable: false,
    },
    {
      id: "org",
      label: "Org Name",
      render: (r) => {
        return r.org.name;
      },
      sortable: false,
    },
    {
      id: "permissions",
      label: "Permissions",
      render: (row: Role) => {
        if (!row.permissions || row.permissions.length === 0) {
          return "No permissions";
        }
        return (
          <div className="permission-grid">
            {row.permissions.map((p, i) => (
              <div key={i} className="permission-card">
                <div className="permission-title">{p.permission_name}</div>
                <div className="permission-tags">
                  {p.isAll ? (
                    <span className="permission-tag all-tag">ALL</span>
                  ) : (
                    p.children?.map((c, j) => (
                      <span key={j} className="permission-tag">
                        {c.permission_name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "actions",
      label: "Actions",
      render: (user) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn-edit"
            onClick={() => {
              setPopupType("update");
              setSelectedIds([user.id]);
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
              setSelectedIds([user.id]);
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
    <div className="report">
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
      {popupType === "update" && (
        <UpdateRolePopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "create" && (
        <CreateRolePopup
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={() => {
          setPopupType("create");
        }}
        title="role"
        placeholder={["Name", " Code", " Org Name"]}
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
