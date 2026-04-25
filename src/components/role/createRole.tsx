import { createPortal } from "react-dom";
import "../../styles/layout/popup.css";
import { ROLE_COLOR_PALETTE } from "../../styles/status-styles";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import { useSwitchOrg } from "../../hooks/admin/org/useSwitchOrg";
import { useRoleForm } from "../../hooks/admin/role/useRoleForm";
import { UsePermission } from "../../hooks/admin/permission/usePermission";
import type { PermissionTree } from "../../types/permission/permissionTree";

export const CreateRolePopup = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { data: switchOrgs } = useSwitchOrg();
  const { data: apiPermissions, loading } = UsePermission();
  // Sử dụng hook
  const {
    form,
    selectedPerms,
    expandedGroups,
    selectedColorHex,
    uiLoading,
    toggleExpand,
    togglePermission,
    toggleGroup,
    handleChange,
    handleSelectColor,
    handleSubmit,
    setForm,
  } = useRoleForm(onClose, onSuccess);

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
            <h2>Create Role</h2>
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
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="required">Role Code</label>
            <input
              name="role_code"
              placeholder="Role Code"
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
                  className={`color-dot-item ${selectedColorHex === styles.text ? "active" : ""}`}
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
                      <div className="header-left">
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
            {uiLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
