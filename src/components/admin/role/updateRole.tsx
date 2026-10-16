import { createPortal } from "react-dom";
import "../../../styles/admin/popup/popup.css";
import { ROLE_COLOR_PALETTE } from "../../../styles/status-styles";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import { useSwitchOrg } from "../../../hooks/admin/org/useSwitchOrg";
import { useRoleForm } from "../../../hooks/admin/role/useRoleForm";
import { UsePermission } from "../../../hooks/admin/permission/usePermission";
import { useRoleById } from "../../../hooks/admin/role/useRoleId";
import { useEffect, useState } from "react";
import { PermissionMatrix } from "./PermissionMatrix";
import { AdminModalError, AdminModalLoading } from "../layout/AdminModalState";

const UPDATE_ROLE_FORM_ID = "update-role-form";

export const UpdateRolePopup = ({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
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
  const roleById = useRoleById(id);
  const [detailReady, setDetailReady] = useState(false);

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
  } = useRoleForm(onClose, onSuccess, roleById, {
    actorRole,
    actorOrganizationId,
    actorOrganizationLoading,
  });

  useEffect(() => {
    setDetailReady(false);
    setSelectedPerms([]);
    setForm({
      role_name: "",
      role_code: "",
      orgId: "",
      colorKey: "gray",
    });
  }, [id, setForm, setSelectedPerms]);

  useEffect(() => {
    const loadData = async () => {
      if (roleById.data) {
        setForm({
          role_name: roleById.data.role_name || "",
          role_code: roleById.data.role_code || "",
          orgId: roleById.data.org?.id || "",
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
        setDetailReady(true);
      }
    };
    loadData();
  }, [roleById.data]);

  useEffect(() => {
    if (!isOwnerActor || !actorOrganizationId) return;

    setForm((prev) =>
      prev.orgId === actorOrganizationId
        ? prev
        : { ...prev, orgId: actorOrganizationId },
    );
  }, [actorOrganizationId, isOwnerActor, setForm]);

  const isInitialLoading = roleById.loading || (!detailReady && !roleById.error);

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

        {roleById.error ? (
          <AdminModalError onRetry={roleById.refetch} />
        ) : isInitialLoading ? (
          <AdminModalLoading />
        ) : (
        <form
          id={UPDATE_ROLE_FORM_ID}
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
        )}

        {detailReady && !roleById.error && (
          <div className="popup-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              form={UPDATE_ROLE_FORM_ID}
              disabled={uiLoading || (isOwnerActor && actorOrganizationLoading)}
            >
              {uiLoading
                ? "Save Changes..."
                : isOwnerActor && actorOrganizationLoading
                  ? "Loading org..."
                  : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
