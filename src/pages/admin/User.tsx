import { useMemo } from "react";
import "../../styles/admin/table/btn-action.css";
import "../../styles/admin/table/table.css";

import type { User } from "../../types/user/user";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import FormControlLabel from "@mui/material/FormControlLabel";
import { getRoleBadgeStyle } from "../../styles/status-styles";
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
  isSuperAdmin,
} from "../../config/adminPermissionConfig";

function normalizeRoleText(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .toUpperCase();
}

function hasSuperAdminRoleMarker(user?: User | null) {
  const roles = Array.isArray(user?.role)
    ? user.role
    : user?.role
      ? [user.role]
      : [];

  return roles.some((role: any) => {
    if (typeof role === "string") {
      return normalizeRoleText(role).includes("SUPERADMIN");
    }

    const roleValues = [
      role?.isSuperAdmin ? "SUPERADMIN" : "",
      role?.roleName,
      role?.roleCode,
      role?.role_name,
      role?.role_code,
      role?.name,
      role?.role?.name,
      role?.role?.code,
      role?.role?.role_name,
      role?.role?.role_code,
      role?.role?.isSuperAdmin ? "SUPERADMIN" : "",
    ];

    return roleValues.some((value) =>
      normalizeRoleText(value).includes("SUPERADMIN"),
    );
  });
}

export default function User() {
  // useatate ẩn hiện
  const currentUser = useInfo();
  const permissionCodes = useMemo(
    () => getUserPermissionCodes(currentUser),
    [currentUser],
  );
  const currentUserIsSuperAdmin = useMemo(
    () => isSuperAdmin(permissionCodes),
    [permissionCodes],
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
    isDeleting,
    selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table, deleteSort);

  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };

  const isProtectedSuperAdminUser = (user: User) =>
    hasSuperAdminRoleMarker(user) ||
    (currentUserIsSuperAdmin &&
      Boolean(currentUser?.id) &&
      user.id === currentUser?.id) ||
    (currentUserIsSuperAdmin &&
      Boolean(currentUser?.email) &&
      user.email === currentUser?.email);

  const visibleUsers = useMemo(
    () => (data.items || []).filter((user) => !isProtectedSuperAdminUser(user)),
    [data.items, currentUser?.email, currentUser?.id, currentUserIsSuperAdmin],
  );

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
          return (
            <span
              className="role-badge user-role-chip user-role-chip--guest"
              style={getRoleBadgeStyle("gray")}
            >
              <span className="user-role-chip__role">GUEST</span>
            </span>
          );
        }
        return (
          <div className="user-role-stack">
            {roles.map((role, index) => {
              const roleName =
                typeof role === "string" ? role : role.role_name || role.role_code || "ROLE";
              const orgName =
                typeof role === "string"
                  ? ""
                  : role.orgName || role.organizationName || "Organization";
              const colorKey = typeof role === "string" ? "gray" : role.colorKey;
              const label = orgName ? `${roleName} of ${orgName}` : roleName;
              return (
                <span
                  key={index}
                  className="role-badge user-role-chip"
                  style={getRoleBadgeStyle(colorKey)}
                  title={label}
                >
                  <span className="user-role-chip__role">{roleName}</span>
                  {orgName && (
                    <>
                      <span className="user-role-chip__divider" aria-hidden="true">
                        ·
                      </span>
                      <span className="user-role-chip__org">{orgName}</span>
                    </>
                  )}
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
              disabled={
                actions.isUpdating ||
                !canUpdateUser ||
                isProtectedSuperAdminUser(user)
              }
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
      render: (user) => {
        const protectedSuperAdmin = isProtectedSuperAdminUser(user);

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {canUpdateUser && !protectedSuperAdmin && (
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
            {canDeleteUser && !protectedSuperAdmin && (
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
            {(!canUpdateUser && !canDeleteUser) || protectedSuperAdmin ? (
              <span className="table-action-empty">No actions</span>
            ) : null}
          </div>
        );
      },
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
            loading={isDeleting}
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
          <div className="admin-table-shell">
            <CustomTable
              rows={visibleUsers}
              columns={userColumns}
              order={table.sortOrder}
              orderBy={table.sortBy}
              onSort={table.handleSort}
              selected={table.selected}
              onSelectOne={table.handleSelectOne}
              onSelectAll={(checked) =>
                table.handleSelectAll(checked, visibleUsers)
              }
            />
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
