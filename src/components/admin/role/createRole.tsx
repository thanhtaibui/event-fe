import { createPortal } from "react-dom";
import "../../../styles/admin/popup/popup.css";
import { ROLE_COLOR_PALETTE } from "../../../styles/status-styles";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import { useSwitchOrg } from "../../../hooks/admin/org/useSwitchOrg";
import { useRoleForm } from "../../../hooks/admin/role/useRoleForm";
import { UsePermission } from "../../../hooks/admin/permission/usePermission";
import { PermissionMatrix } from "./PermissionMatrix";
import { useEffect } from "react";

export const CreateRolePopup = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const {
    data: apiPermissions,
    loading: permissionLoading,
    error: permissionError,
    actorRole,
    actorOrganizationId,
    actorOrganizationLoading,
    refetch: refetchPermissions,
  } = UsePermission();
  const isSuperAdminActor = actorRole === "SUPER_ADMIN";
  const isOwnerActor = actorRole === "OWNER";
  const { data: switchOrgs } = useSwitchOrg(isSuperAdminActor);
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
  } = useRoleForm(onClose, onSuccess, undefined, {
    actorRole,
    actorOrganizationId,
    actorOrganizationLoading,
  });

  useEffect(() => {
    if (!isOwnerActor || !actorOrganizationId) return;

    setForm((prev) =>
      prev.orgId === actorOrganizationId
        ? prev
        : { ...prev, orgId: actorOrganizationId },
    );
  }, [actorOrganizationId, isOwnerActor, setForm]);

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

          {isSuperAdminActor && (
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
                  setForm({ ...form, orgId: selected?.value || "" })
                }
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                }}
              />
            </div>
          )}

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
            <PermissionMatrix
              permissions={apiPermissions}
              selectedPerms={selectedPerms}
              expandedGroups={expandedGroups}
              loading={permissionLoading}
              error={permissionError}
              onRetry={refetchPermissions}
              toggleExpand={toggleExpand}
              togglePermission={togglePermission}
              toggleGroup={toggleGroup}
            />
          </div>
        </form>

        <div className="popup-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="popup-form"
            disabled={uiLoading || (isOwnerActor && actorOrganizationLoading)}
          >
            {uiLoading
              ? "Creating..."
              : isOwnerActor && actorOrganizationLoading
                ? "Loading org..."
                : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
