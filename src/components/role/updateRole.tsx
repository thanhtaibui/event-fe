import { createPortal } from "react-dom";
import "../../styles/layout/popup.css";
import { ROLE_COLOR_PALETTE } from "../../styles/status-styles";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import { useSwitchOrg } from "../../hooks/admin/org/useSwitchOrg";
import { useRoleForm } from "../../hooks/admin/role/useRoleForm";
import { UsePermission } from "../../hooks/admin/permission/usePermission";
import type { PermissionTree } from "../../types/permission/permissionTree";
import { useRoleById } from "../../hooks/admin/role/useRoleId";
import { useEffect } from "react";

export const UpdateRolePopup = ({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { data: switchOrgs } = useSwitchOrg();
  const { data: apiPermissions } = UsePermission();
  const roleById = useRoleById(id);

  // Sử dụng hook
  const {
    form,
    selectedPerms,
    expandedGroups,
    uiLoading,
    toggleExpand,
    togglePermission,
    toggleGroup,
    handleChange,
    handleSelectColor,
    handleSubmit,
    setForm,
    setSelectedPerms,
  } = useRoleForm(onClose, onSuccess, roleById);

  useEffect(() => {
    const loadData = async () => {
      if (roleById.data) {
        setForm({
          role_name: roleById.data.role_name || "",
          role_code: roleById.data.role_code || "",
          orgId: roleById.data.org.id,
          colorKey: roleById.data.colorKey,
        });
        const allIds: string[] = [];
        const extractIds = (items: any[]) => {
          items.forEach((item) => {
            allIds.push(String(item.id));
            if (item.children && item.children.length > 0) {
              extractIds(item.children); // Nếu có con thì chui vào lấy tiếp
            }
          });
        };
        extractIds(roleById.data.permissions);
        // console.log("Full Permission IDs (Cha + Con):", allIds);
        setSelectedPerms(allIds);
      }
    };
    loadData();
  }, [roleById.data]);
  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/material-rounded/24/user-shield.png"
                alt="user-shield"
              />
            </div>
            <h2>Update Role</h2>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          id="popup-form"
          className="popup-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-group">
            <label className="required">Role Name</label>
            <input
              name="role_name"
              placeholder="Role Name"
              value={form.role_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="required">Role Code</label>
            <input
              style={{
                color: "gray",
                userSelect: "none",
                pointerEvents: "none",
              }}
              name="role_code"
              value={form.role_code}
              placeholder="Role Code"
              disabled
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="required">Organization Scope</label>
            <Select
              className="react-select"
              classNamePrefix="custom-select"
              placeholder="Select organization..."
              options={switchOrgs?.map((o: any) => ({
                value: o.id,
                label: o.name,
                type: "org",
              }))}
              value={
                switchOrgs
                  ?.map((o: any) => ({
                    value: o.id,
                    label: o.name,
                    type: "org",
                  }))
                  .find((o: any) => o.value === form.orgId) || null
              }
              onChange={(selected: any) =>
                setForm({ ...form, orgId: selected?.value })
              }
              components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue,
              }}
            />
          </div>

          <div className="form-group">
            <label className="required">Role Color</label>
            <div className="color-picker-simple-grid">
              {Object.entries(ROLE_COLOR_PALETTE).map(([key, styles]) => (
                <div
                  key={key}
                  className={`color-dot-item ${form.colorKey === key ? "active" : ""}`}
                  style={
                    {
                      backgroundColor: styles.text,
                      "--selected-color": styles.text,
                    } as any
                  }
                  onClick={() => handleSelectColor(styles.text, key)}
                />
              ))}
            </div>
          </div>

          <div className="form-permission">
            <label className="required">Permission Matrix</label>
            <div className="permission-matrix-container">
              {apiPermissions?.map((group: PermissionTree) => {
                const groupPermIds =
                  group.children?.map((child) => child.id) || [];
                const isGroupActive = groupPermIds.some((id) =>
                  selectedPerms.includes(id),
                );
                const isGroupAllSelected = groupPermIds.every((id) =>
                  selectedPerms.includes(id),
                );
                const childIds = group.children?.map((c: any) => c.id) || [];
                return (
                  <div key={group.id} className="permission-group">
                    <div
                      className={`group-header ${isGroupActive ? "active" : ""}`}
                      onClick={() => toggleGroup(group.id, childIds)}
                    >
                      <div className="header-left-popup">
                        <div
                          className={`custom-checkbox ${isGroupAllSelected ? "checked" : isGroupActive ? "indeterminate" : ""}`}
                        >
                          {isGroupAllSelected ? "✓" : isGroupActive ? "-" : ""}
                        </div>
                        <span>{group.permission_name}</span>
                      </div>

                      <div
                        className="toggle-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(group.id);
                        }}
                      >
                        <span
                          style={{
                            transform: expandedGroups.includes(group.id)
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                            display: "inline-block",
                            transition: "0.2s",
                          }}
                        >
                          ▶
                        </span>
                      </div>
                    </div>

                    {expandedGroups.includes(group.id) && (
                      <div className="group-children">
                        {group.children?.map((child) => {
                          const isChecked = selectedPerms.includes(child.id);
                          return (
                            <div
                              key={child.id}
                              className={`perm-item ${isChecked ? "checked" : ""}`}
                              onClick={() =>
                                togglePermission(group.id, child.id)
                              }
                            >
                              <div
                                className={`custom-checkbox ${isChecked ? "checked" : ""}`}
                              >
                                {isChecked && "✓"}
                              </div>
                              <span>{child.permission_name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="popup-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="popup-form" disabled={uiLoading}>
            {uiLoading ? "Save Changes..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
