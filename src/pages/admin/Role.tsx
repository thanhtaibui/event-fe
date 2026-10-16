import Pagination from "../../components/admin/table/Pagination";
import { PopupHideItems } from "../../components/admin/layout/PopupHideItems";
import { SearchBar } from "../../components/admin/table/SearchBar";
import CustomTable, { type Column } from "../../components/admin/table/Table";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import { UseRole } from "../../hooks/admin/role/useRole";
import { UseOrgRole } from "../../hooks/org/role/useRole";
import { useDataTable } from "../../hooks/admin/useDataTable";
import type { Role } from "../../types/role/role";
import "../../styles/admin/table/btn-action.css";
import "../../styles/admin/table/table.css";
// import { useState } from "react";
import { getRoleBadgeStyle } from "../../styles/status-styles";
import { CreateRolePopup } from "../../components/admin/role/createRole";
import ConfirmDialog from "../../components/admin/layout/DialogConfirm";
import { usePageActions } from "../../hooks/admin/usePageActions";
import { UpdateRolePopup } from "../../components/admin/role/updateRole";
import { useDelete } from "../../hooks/admin/role/useDelete";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { roleService } from "../../services/admin/role.service";
import { jwtDecode } from "jwt-decode";
import { UsePermission } from "../../hooks/admin/permission/usePermission";
import {
  ADMIN_PERMISSION_CODES,
  canAccessAdminAction,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipSlug,
  isSuperAdmin,
  normalizeUserMemberships,
} from "../../config/adminPermissionConfig";
import { getAccessToken } from "../../constants/authStorage";
import { useOrgsByUser } from "../../hooks/admin/org/useOrgsByUser";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import type { PermissionTree } from "../../types/permission/permissionTree";

type PermissionTooltipState = {
  id: string;
  top: number;
  left: number;
  names: string[];
};

type CanonicalPermissionGroup = {
  childCount: number;
  children: PermissionTree[];
};

function normalizePermissionSummaryKey(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}

function collectPermissionTreeChildren(items: PermissionTree[] = []): PermissionTree[] {
  return items.flatMap((item) => [
    item,
    ...collectPermissionTreeChildren(item.children || []),
  ]);
}

function buildCanonicalPermissionGroups(permissions: PermissionTree[]) {
  const groups = new Map<string, CanonicalPermissionGroup>();

  permissions.forEach((group) => {
    const children = collectPermissionTreeChildren(group.children || []);
    const entry = {
      childCount: children.length,
      children,
    };

    [
      normalizePermissionSummaryKey(group.id),
      normalizePermissionSummaryKey(group.permission_name),
    ]
      .filter(Boolean)
      .forEach((key) => groups.set(key, entry));
  });

  return groups;
}

function getPermissionMatchKeys(permission: {
  permission_code?: string;
  permission_name?: string;
  id?: string;
}) {
  return [
    normalizePermissionSummaryKey(permission.id),
    normalizePermissionSummaryKey(permission.permission_code),
    normalizePermissionSummaryKey(permission.permission_name),
  ].filter(Boolean);
}

function countSelectedCanonicalChildren(
  selectedChildren: Role["permissions"],
  canonicalChildren: PermissionTree[],
) {
  const selectedKeys = new Set(
    selectedChildren.flatMap((child) => getPermissionMatchKeys(child)),
  );

  return canonicalChildren.filter((child) =>
    getPermissionMatchKeys(child).some((key) => selectedKeys.has(key)),
  ).length;
}

export default function Role() {
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
  const canCreateRole = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.ROLE,
    "create",
  );
  const canUpdateRole = canAccessAdminAction(
    permissionCodes,
    ADMIN_PERMISSION_CODES.ROLE,
    "update",
  );
  const canDeleteRole = isSuperAdmin(permissionCodes);
  const [permissionByRoleId, setPermissionByRoleId] = useState<
    Record<string, Role["permissions"]>
  >({});
  const [permissionLoadingIds, setPermissionLoadingIds] = useState<string[]>(
    []
  );
  const [permissionTooltip, setPermissionTooltip] =
    useState<PermissionTooltipState | null>(null);
  const { data: canonicalPermissions } = UsePermission();
  const canonicalPermissionGroups = useMemo(
    () => buildCanonicalPermissionGroups(canonicalPermissions),
    [canonicalPermissions],
  );
  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };

  const showPermissionTooltip = (
    event: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
    id: string,
    names: string[],
  ) => {
    if (names.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = Math.min(360, window.innerWidth * 0.72);
    const left = Math.min(
      Math.max(rect.left, 12),
      Math.max(window.innerWidth - tooltipWidth - 12, 12),
    );

    setPermissionTooltip({
      id,
      names,
      top: rect.bottom + 8,
      left,
    });
  };

  const hidePermissionTooltip = (id: string) => {
    setPermissionTooltip((current) => (current?.id === id ? null : current));
  };

  const { data, loading, search, table, pagination, refetch } =
    useDataTable<Role>({
      fetchHook: (query) =>
        isOrgWorkspace ? UseOrgRole(slug || "", query) : UseRole(query),
      // updateApi: userService.updateActive,
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

  const handleRoleChanged = () => {
    setPermissionByRoleId({});
    refetch?.();
  };

  useEffect(() => {
    const roleIds = (data.items || [])
      .map((role) => role.id)
      .filter((id) => !permissionByRoleId[id]);

    if (loading || roleIds.length === 0) return;

    let ignore = false;
    setPermissionLoadingIds((prev) => [...new Set([...prev, ...roleIds])]);

    Promise.all(
      roleIds.map(async (id) => {
        try {
          const res = await roleService.getRolePermissions(id);
          return {
            id,
            permissions: res.data?.permissions || [],
          };
        } catch (error) {
          console.error(`Fetch permissions of role ${id} error:`, error);
          return {
            id,
            permissions: [],
          };
        }
      })
    ).then((results) => {
      if (ignore) return;

      setPermissionByRoleId((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          next[item.id] = item.permissions;
        });
        return next;
      });
      setPermissionLoadingIds((prev) =>
        prev.filter((id) => !roleIds.includes(id))
      );
    });

    return () => {
      ignore = true;
    };
  }, [data.items, loading, permissionByRoleId]);

  const reportColumns: Column<Role>[] = [
    {
      id: "role_name",
      label: "Role Name",
      render: (r) => {
        return (
          <span
            className="role-badge"
            style={{
              ...getRoleBadgeStyle(r.colorKey),
              userSelect: "none",
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
        const permissions = permissionByRoleId[row.id] || row.permissions || [];
        if (permissionLoadingIds.includes(row.id)) {
          return (
            <span className="permission-loading" aria-label="Loading permissions">
              <i />
              <i />
              <i />
            </span>
          );
        }
        if (!permissions || permissions.length === 0) {
          return "No permissions";
        }
        return (
          <div className="permission-grid">
            {permissions.map((p, i) => {
              const childPermissions = p.children || [];
              const canonicalGroup =
                getPermissionMatchKeys(p)
                  .map((key) => canonicalPermissionGroups.get(key))
                  .find(Boolean) || null;
              const selectedChildCount = canonicalGroup
                ? countSelectedCanonicalChildren(
                  childPermissions,
                  canonicalGroup.children,
                )
                : childPermissions.length;
              const isAllSelected = canonicalGroup
                ? canonicalGroup.childCount > 0 &&
                  selectedChildCount === canonicalGroup.childCount
                : Boolean(p.isAll);
              const permissionTooltipId = `${row.id}-${p.permission_name}-${i}`;
              const childPermissionNames = childPermissions.map(
                (child) => child.permission_name,
              );
              const detailLabel = isAllSelected
                ? `${p.permission_name}: All permissions`
                : selectedChildCount > 0
                  ? `${p.permission_name}: ${childPermissions
                    .map((c) => c.permission_name)
                    .join(", ")}`
                  : p.permission_name;

              return (
                <div
                  key={i}
                  className="permission-card"
                  tabIndex={0}
                  aria-label={detailLabel}
                  onMouseEnter={(event) =>
                    !isAllSelected &&
                    showPermissionTooltip(
                      event,
                      permissionTooltipId,
                      childPermissionNames,
                    )
                  }
                  onMouseLeave={() => hidePermissionTooltip(permissionTooltipId)}
                  onFocus={(event) =>
                    !isAllSelected &&
                    showPermissionTooltip(
                      event,
                      permissionTooltipId,
                      childPermissionNames,
                    )
                  }
                  onBlur={() => hidePermissionTooltip(permissionTooltipId)}
                >
                  <div className="permission-title">{p.permission_name}</div>
                  <div className="permission-tags">
                    {isAllSelected ? (
                      <span className="permission-tag all-tag">ALL</span>
                    ) : (
                      selectedChildCount > 0 && (
                        <span
                          className="permission-tag permission-tag--more"
                          title={detailLabel}
                        >
                          +{selectedChildCount}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
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
          {canUpdateRole && (
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
          {canDeleteRole && (
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
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="admin-page report">
      {permissionTooltip &&
        createPortal(
          <div
            className="permission-floating-details"
            role="tooltip"
            style={{
              top: permissionTooltip.top,
              left: permissionTooltip.left,
            }}
          >
            {permissionTooltip.names.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>,
          document.body,
        )}
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
      {popupType === "update" && (
        <UpdateRolePopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={handleRoleChanged}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "create" && (
        <CreateRolePopup
          onSuccess={handleRoleChanged}
          onClose={() => setPopupType(null)}
        />
      )}
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={canCreateRole ? () => {
          setPopupType("create");
        } : undefined}
        title="role"
        placeholder={["Name", " Code", " Org Name"]}
      />
      {loading ? (
        <AdminSkeleton variant="table" rows={7} />
      ) : (
        <>
          <div className="admin-table-shell">
            <CustomTable
              rows={data.items}
              columns={reportColumns}
              order={table.sortOrder}
              orderBy={table.sortBy}
              onSort={table.handleSort}
              selected={table.selected}
              tableClassName="role-table-container"
              onSelectOne={table.handleSelectOne}
              onSelectAll={(checked) =>
                table.handleSelectAll(checked, data.items || [])
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
