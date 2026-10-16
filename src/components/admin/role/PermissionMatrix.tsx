import { ChevronRight } from "lucide-react";
import type { PermissionTree } from "../../../types/permission/permissionTree";

type PermissionMatrixProps = {
  permissions: PermissionTree[];
  selectedPerms: string[];
  expandedGroups: string[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  toggleExpand: (groupId: string) => void;
  togglePermission: (parentId: string, permId: string) => void;
  toggleGroup: (parentId: string, childIds: string[]) => void;
};

function collectPermissionIds(items: PermissionTree[] = []): string[] {
  return items.flatMap((item) => [
    item.id,
    ...collectPermissionIds(item.children || []),
  ]);
}

export function PermissionMatrix({
  permissions,
  selectedPerms,
  expandedGroups,
  loading = false,
  error = "",
  onRetry,
  toggleExpand,
  togglePermission,
  toggleGroup,
}: PermissionMatrixProps) {
  const renderChildren = (parentId: string, children: PermissionTree[] = []) => {
    if (!children.length) return null;

    return (
      <div className="role-permission-matrix__children">
        {children.map((child) => {
          const isChecked = selectedPerms.includes(child.id);
          const hasNestedChildren = Boolean(child.children?.length);

          return (
            <div key={child.id} className="role-permission-matrix__child-block">
              <button
                type="button"
                className={`role-permission-matrix__row role-permission-matrix__row--child ${
                  isChecked ? "is-selected" : ""
                }`}
                onClick={() => togglePermission(parentId, child.id)}
              >
                <span
                  className={`role-permission-matrix__checkbox ${
                    isChecked ? "is-checked" : ""
                  }`}
                  aria-hidden="true"
                >
                  {isChecked && "✓"}
                </span>
                <span className="role-permission-matrix__label">
                  {child.permission_name}
                </span>
              </button>
              {hasNestedChildren && renderChildren(parentId, child.children)}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="role-permission-matrix role-permission-matrix--state">
        <div className="role-permission-matrix__loading" aria-live="polite">
          <span className="role-permission-matrix__spinner" aria-hidden="true" />
          <div>
            <strong>Loading permissions</strong>
            <p>Preparing the permission matrix for this role.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="role-permission-matrix role-permission-matrix--state">
        <div className="role-permission-matrix__error" role="alert">
          <strong>Permission list unavailable</strong>
          <p>{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!permissions.length) {
    return (
      <div className="role-permission-matrix role-permission-matrix--state">
        <div className="role-permission-matrix__empty">
          No permissions available for this role.
        </div>
      </div>
    );
  }

  return (
    <div className="role-permission-matrix">
      {permissions.map((group) => {
        const childIds = collectPermissionIds(group.children || []);
        const groupToggleIds = childIds.length ? childIds : [group.id];
        const isGroupActive =
          selectedPerms.includes(group.id) ||
          groupToggleIds.some((id) => selectedPerms.includes(id));
        const isGroupAllSelected = groupToggleIds.every((id) =>
          selectedPerms.includes(id),
        );
        const isExpanded = expandedGroups.includes(group.id);

        return (
          <section key={group.id} className="role-permission-matrix__group">
            <div
              className={`role-permission-matrix__row role-permission-matrix__row--parent ${
                isGroupActive ? "is-selected" : ""
              }`}
            >
              <button
                type="button"
                className="role-permission-matrix__select"
                onClick={() =>
                  childIds.length
                    ? toggleGroup(group.id, childIds)
                    : togglePermission(group.id, group.id)
                }
              >
                <span
                  className={`role-permission-matrix__checkbox ${
                    isGroupAllSelected
                      ? "is-checked"
                      : isGroupActive
                        ? "is-indeterminate"
                        : ""
                  }`}
                  aria-hidden="true"
                >
                  {isGroupAllSelected ? "✓" : isGroupActive ? "-" : ""}
                </span>
                <span className="role-permission-matrix__label">
                  {group.permission_name}
                </span>
              </button>

              {Boolean(group.children?.length) && (
                <button
                  type="button"
                  className="role-permission-matrix__expand"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.permission_name}`}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(group.id)}
                >
                  <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
            </div>

            {isExpanded && renderChildren(group.id, group.children)}
          </section>
        );
      })}
    </div>
  );
}
