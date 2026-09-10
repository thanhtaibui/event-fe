import { useMemo } from "react";
import "../../styles/admin/table/btn-action.css";
import "../../styles/admin/table/table.css";

import type { User } from "../../types/user/user";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ROLE_COLOR_PALETTE } from "../../styles/status-styles";
// import component
import { IOSSwitch } from "../../components/admin/table/Switch";
import { SearchBar } from "../../components/admin/table/SearchBar";
import { CreateUserPopup } from "../../components/admin/user/createUser";
import Pagination from "../../components/admin/table/Pagination";
import CustomTable from "../../components/admin/table/Table";
import type { Column } from "../../components/admin/table/Table";
import { PopupHideItems } from "../../components/admin/layout/PopupHideItems";
import ConfirmDialog from "../../components/admin/layout/DialogConfirm";
//  hook
import { useDataTable } from "../../hooks/admin/useDataTable";
import { useUser } from "../../hooks/admin/user/useUser";
import { userService } from "../../services/admin/user.service";
import { usePageActions } from "../../hooks/admin/usePageActions";
import { useDelete } from "../../hooks/admin/user/useDelete";
import { UpdateUserPopup } from "../../components/admin/user/updateUser";
import { useInfo } from "../../hooks/layout/useInfo";
import {
  ADMIN_PERMISSION_CODES,
  canAccessAdminAction,
  getUserPermissionCodes,
} from "../../config/adminPermissionConfig";

export default function User() {
  // useatate ẩn hiện
  const currentUser = useInfo();
  const permissionCodes = useMemo(
    () => getUserPermissionCodes(currentUser),
    [currentUser],
  );
  const canCreateUser = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.USER,
    "create",
  );
  const canUpdateUser = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.USER,
    "update",
  );
  const canDeleteUser = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.USER,
    "delete",
  );

  const { data, loading, search, filter, table, pagination, actions, refetch } =
    useDataTable<User>({
      fetchHook: useUser,
      updateApi: userService.updateActive,
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

  // setup column
  const userColumns: Column<User>[] = [
    { id: "fullName", label: "FullName", sortable: true },
    { id: "email", label: "Email", sortable: true },
    {
      id: "role",
      label: "Role of Org",
      render: (row: User) => {
        const roles = Array.isArray(row.role)
          ? row.role
          : row.role
            ? [row.role]
            : [];

        if (roles.length === 0) {
          const guestStyle = ROLE_COLOR_PALETTE.gray;
          return (
            <span
              className="role-badge"
              style={{
                background: guestStyle.bg,
                color: guestStyle.text,
                border: guestStyle.border,
              }}
            >
              GUEST
            </span>
          );
        }
        return (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {roles.map((role, index) => {
              const roleName =
                typeof role === "string" ? role : role.role_name || role.role_code || "ROLE";
              const orgName =
                typeof role === "string"
                  ? ""
                  : role.orgName || role.organizationName || "Organization";
              const style =
                ROLE_COLOR_PALETTE[
                  typeof role === "string"
                    ? "gray"
                    : (role.colorKey as keyof typeof ROLE_COLOR_PALETTE)
                ] || ROLE_COLOR_PALETTE.gray;
              return (
                <span
                  key={index}
                  className={`role-badge`}
                  style={{
                    background: style.bg,
                    color: style.text,
                    border: style.border,
                  }}
                >
                  {orgName ? `${roleName} of ${orgName}` : roleName}
                </span>
              );
            })}
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "isActive",
      label: "Active",
      render: (user) => (
        <FormControlLabel
          control={
            <IOSSwitch
              sx={{ m: 1 }}
              checked={user.isActive}
              disabled={actions.isUpdating || !canUpdateUser}
              onChange={(e) =>
                actions.toggleActive?.(user.id, e.target.checked)
              }
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
      render: (user) => (
        <div style={{ display: "flex", gap: "8px" }}>
          {canUpdateUser && (
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
          )}
          {canDeleteUser && (
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
          )}
          {!canUpdateUser && !canDeleteUser && (
            <span className="table-action-empty">No actions</span>
          )}
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="admin-page admin-page--users">
      {canDeleteUser && (
        <>
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
        </>
      )}
      {canCreateUser && popupType === "create" && (
        <CreateUserPopup
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {canUpdateUser && popupType === "update" && (
        <UpdateUserPopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={canCreateUser ? () => setPopupType("create") : undefined}
        title="user"
        placeholder={["Name", " Email"]}
        filters={[
          {
            key: "isActive",
            placeholder: "Active",
            options: [
              { label: "Active", value: "true" },
              { label: "InActive", value: "false" },
            ],
          },
        ]}
        onFilterChange={filter.handleFilterChange}
      />
      {loading ? (
        <AdminSkeleton variant="table" rows={7} />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={userColumns}
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
