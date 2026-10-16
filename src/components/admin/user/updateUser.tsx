import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUpdateUser } from "../../../hooks/admin/user/useUpdate";
import { useUserById } from "../../../hooks/admin/user/useUserId";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import "../../../styles/admin/popup/popup.css";
import { toast } from "react-toastify";
import { useSwitchOrg } from "../../../hooks/admin/org/useSwitchOrg";
import { useRolesOrg } from "../../../hooks/admin/role/useRolesOrg";
import { orgService } from "../../../services/admin/organization.service";
import { unwrapOrgApiResponse } from "../../../hooks/admin/org/useOrg";
import type { Membership } from "../../../types/membership/membership";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import { AdminModalError, AdminModalLoading } from "../layout/AdminModalState";
import { ShieldCheck } from "lucide-react";

const UPDATE_USER_FORM_ID = "update-user-form";

type UpdateUserForm = {
  fullName: string;
  phoneNumber: string;
};

type UpdateUserErrors = Partial<Record<keyof UpdateUserForm, string>>;

type OwnerCardItem = {
  orgName: string;
  roleName: string;
  colorKey?: string;
  orgId?: string;
  roleId?: string;
};

const PHONE_PATTERN = /^\+?[0-9\s.-]{8,18}$/;

function getAdminPopupThemeClass() {
  if (typeof window === "undefined") return "admin-popup-theme--light";
  return localStorage.getItem("eventix-theme") === "dark"
    ? "admin-popup-theme--dark"
    : "admin-popup-theme--light";
}

function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function isOwnerRole(item: any): boolean {
  if (!item) return false;
  if (item.isOwner === true) return true;
  const name = (
    item.role_name ||
    item.roleName ||
    item.role?.role_name ||
    item.role?.name ||
    item.name ||
    ""
  ).trim().toLowerCase();
  if (name === "owner") return true;

  const code = (
    item.role_code ||
    item.roleCode ||
    item.role?.role_code ||
    item.role?.code ||
    item.code ||
    ""
  ).trim().toLowerCase();
  if (code === "owner" || code === "org_owner" || code === "organization_owner") return true;

  return false;
}

function normalizeRolesList(rawRoles: any): any[] {
  if (Array.isArray(rawRoles)) return rawRoles;
  if (rawRoles && Array.isArray(rawRoles.data)) return rawRoles.data;
  if (rawRoles && Array.isArray(rawRoles.items)) return rawRoles.items;
  return [];
}

function extractUserRoles(userData: any): any[] {
  if (!userData) return [];
  if (Array.isArray(userData.role)) return userData.role;
  if (Array.isArray(userData.roles)) return userData.roles;
  if (Array.isArray(userData.memberships)) return userData.memberships;
  if (userData.role && typeof userData.role === "object") return [userData.role];
  if (typeof userData.role === "string" && userData.role.trim()) {
    return [{ role_name: userData.role }];
  }
  return [];
}

async function fetchAllOrganizations(): Promise<Array<{ id: string; name: string }>> {
  const orgMap = new Map<string, { id: string; name: string }>();

  const addOrgs = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (item && item.id && item.name) {
        orgMap.set(String(item.id), { id: String(item.id), name: String(item.name) });
      }
    });
  };

  const results = await Promise.allSettled([
    orgService.getSwitchOrgs(),
    orgService.getOrgs({ limit: 100 } as any),
    orgService.getPublicOrganizations({ limit: 100 } as any),
  ]);

  if (results[0].status === "fulfilled" && results[0].value) {
    const data = results[0].value?.data ?? results[0].value;
    addOrgs(Array.isArray(data) ? data : []);
  }

  if (results[1].status === "fulfilled" && results[1].value) {
    const unwrapped = unwrapOrgApiResponse(results[1].value);
    addOrgs(unwrapped.items);
  }

  if (results[2].status === "fulfilled" && results[2].value) {
    const unwrapped = unwrapOrgApiResponse(results[2].value);
    addOrgs(unwrapped.items);
  }

  return Array.from(orgMap.values());
}

function validateUpdateUserForm(form: UpdateUserForm) {
  const errors: UpdateUserErrors = {};
  const fullName = form.fullName.trim();
  const phoneNumber = form.phoneNumber.trim();
  const phoneDigits = phoneNumber.replace(/\D/g, "");

  if (!fullName) {
    errors.fullName = "Full name is required";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  if (!phoneNumber) {
    errors.phoneNumber = "Phone number is required";
  } else if (!PHONE_PATTERN.test(phoneNumber) || phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phoneNumber = "Phone number must contain 9-15 digits";
  }

  return errors;
}

export const UpdateUserPopup = ({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { updateUser } = useUpdateUser();
  // form input
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [owners, setOwners] = useState<OwnerCardItem[]>([]);
  const [form, setForm] = useState<UpdateUserForm>({
    fullName: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<UpdateUserErrors>({});

  const [uiLoading, setUiLoading] = useState(false);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const popupThemeClass = getAdminPopupThemeClass();

  const userById = useUserById(id);

  const {
    data: userDetail,
    refetch: refetchUserDetail,
  } = useOrgsByUser(id); // fallback danh sách org với role của user nếu có
  const { data: switchOrgs } = useSwitchOrg(); // danh sách org từ switch-org
  const { fetchRolesOrgs } = useRolesOrg(); // fetch roles theo từng org
  const [availableOrgs, setAvailableOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [rolesByOrg, setRolesByOrg] = useState<Record<string, any[]>>({});
  const [detailReady, setDetailReady] = useState(false);
  const [detailRoleLoading, setDetailRoleLoading] = useState(false);

  // Sync any switchOrgs into availableOrgs
  useEffect(() => {
    if (Array.isArray(switchOrgs) && switchOrgs.length > 0) {
      setAvailableOrgs((prev) => {
        const map = new Map<string, { id: string; name: string }>();
        prev.forEach((o) => map.set(o.id, o));
        switchOrgs.forEach((o: any) => {
          if (o && o.id && o.name) {
            map.set(String(o.id), { id: String(o.id), name: String(o.name) });
          }
        });
        return Array.from(map.values());
      });
    }
  }, [switchOrgs]);

  useEffect(() => {
    setDetailReady(false);
    setDetailRoleLoading(false);
    setMemberships([]);
    setOwners([]);
    setRolesByOrg({});
    setErrors({});
    setForm({
      fullName: "",
      phoneNumber: "",
    });
  }, [id]);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (userById.loading) return;
      if (userById.error || !userById.data) return;

      setDetailRoleLoading(true);
      setDetailReady(false);

      try {
        const userData =
          userById.data?.data && typeof userById.data.data === "object" && !Array.isArray(userById.data.data)
            ? userById.data.data
            : userById.data;

        // 1. Fetch full organization list
        const orgs = await fetchAllOrganizations();
        const orgMap = new Map<string, { id: string; name: string }>();
        if (Array.isArray(switchOrgs)) {
          switchOrgs.forEach((o: any) => {
            if (o?.id && o?.name) orgMap.set(String(o.id), { id: String(o.id), name: String(o.name) });
          });
        }
        orgs.forEach((o) => orgMap.set(o.id, o));
        const combinedOrgs = Array.from(orgMap.values());

        if (ignore) return;
        setAvailableOrgs(combinedOrgs);

        // 2. Set form basic fields
        setForm({
          fullName: userData?.fullName || "",
          phoneNumber: userData?.phoneNumber || "",
        });

        // 3. Extract user roles from API detail (fallback to userDetail if empty)
        const rawRoles = extractUserRoles(userData);
        const finalRolesList =
          rawRoles.length > 0
            ? rawRoles
            : Array.isArray(userDetail) && userDetail.length > 0
              ? userDetail
              : [];

        // Partition roles: Owner roles vs normal editable roles
        const ownerRoles = finalRolesList.filter((item) => isOwnerRole(item));
        const normalRoles = finalRolesList.filter((item) => !isOwnerRole(item));

        const nextRolesByOrg: Record<string, any[]> = {};
        const resolvedOwnerCards: OwnerCardItem[] = [];

        // Process Owner roles (read-only cards)
        for (const item of ownerRoles) {
          if (!item) continue;

          const orgName = (
            item.orgName ||
            item.organizationName ||
            item.organization?.name ||
            item.org?.name ||
            (typeof item.name === "string" && !item.role_name ? item.name : "") ||
            ""
          ).trim();

          const orgId =
            item.orgId ||
            item.organizationId ||
            item.organization?.id ||
            item.org?.id ||
            (item.id && !item.role_name ? item.id : "");

          const targetOrgNorm = normalizeText(orgName);

          const matchedOrg = combinedOrgs.find((o) => {
            if (orgId && String(o.id) === String(orgId)) return true;
            if (targetOrgNorm && normalizeText(o.name) === targetOrgNorm) return true;
            return false;
          });

          const currentOrgId = matchedOrg ? matchedOrg.id : (orgId ? String(orgId) : "");
          let currentRoleId = item.roleId || item.role?.id || "";

          if (currentOrgId) {
            let roles = nextRolesByOrg[currentOrgId];
            if (!roles) {
              const res = await fetchRolesOrgs(currentOrgId);
              if (ignore) return;
              roles = normalizeRolesList(res);
              nextRolesByOrg[currentOrgId] = roles;
            }

            if (!currentRoleId) {
              const matchedOwnerRole = roles.find((r: any) => isOwnerRole(r));
              if (matchedOwnerRole) {
                currentRoleId = String(matchedOwnerRole.id);
              }
            }
          }

          resolvedOwnerCards.push({
            orgName: matchedOrg ? matchedOrg.name : (orgName || "Organization"),
            roleName: item.role_name || item.roleName || "Owner",
            colorKey: item.colorKey || "blue",
            orgId: currentOrgId,
            roleId: currentRoleId,
          });
        }

        // Process Normal roles (editable rows in Organizations & Roles)
        const newMemberships: Membership[] = [];

        for (const item of normalRoles) {
          if (!item) continue;

          const orgName = (
            item.orgName ||
            item.organizationName ||
            item.organization?.name ||
            item.org?.name ||
            (typeof item.name === "string" && !item.role_name ? item.name : "") ||
            ""
          ).trim();

          const orgId =
            item.orgId ||
            item.organizationId ||
            item.organization?.id ||
            item.org?.id ||
            (item.id && !item.role_name ? item.id : "");

          const targetOrgNorm = normalizeText(orgName);

          const matchedOrg = combinedOrgs.find((o) => {
            if (orgId && String(o.id) === String(orgId)) return true;
            if (targetOrgNorm && normalizeText(o.name) === targetOrgNorm) return true;
            return false;
          });

          if (matchedOrg) {
            const currentOrgId = matchedOrg.id;
            let roles = nextRolesByOrg[currentOrgId];
            if (!roles) {
              const res = await fetchRolesOrgs(currentOrgId);
              if (ignore) return;
              roles = normalizeRolesList(res);
              nextRolesByOrg[currentOrgId] = roles;
            }

            const targetRoleName = (
              item.role_name ||
              item.roleName ||
              item.role?.role_name ||
              item.role?.name ||
              ""
            ).trim();

            const targetRoleCode = (
              item.role_code ||
              item.roleCode ||
              item.role?.role_code ||
              item.role?.code ||
              ""
            ).trim();

            const targetRoleId = item.roleId || item.role?.id;
            const targetRoleNorm = normalizeText(targetRoleName);
            const targetCodeNorm = normalizeText(targetRoleCode);

            const matchedRole = roles.find((r: any) => {
              if (targetRoleId && String(r.id) === String(targetRoleId)) return true;
              if (targetRoleNorm) {
                if (normalizeText(r.role_name) === targetRoleNorm) return true;
                if (normalizeText(r.name) === targetRoleNorm) return true;
              }
              if (targetCodeNorm) {
                if (normalizeText(r.role_code) === targetCodeNorm) return true;
                if (normalizeText(r.code) === targetCodeNorm) return true;
              }
              return false;
            });

            newMemberships.push({
              orgId: currentOrgId,
              roleId: matchedRole ? String(matchedRole.id) : "",
            });
          } else {
            console.warn(
              `[UpdateUserPopup] Organization not found in options for role item:`,
              item
            );
          }
        }

        if (ignore) return;
        setOwners(resolvedOwnerCards);
        setMemberships(newMemberships);
        setRolesByOrg(nextRolesByOrg);
        setDetailReady(true);
      } catch (err) {
        console.error("[UpdateUserPopup] Error loading user detail memberships:", err);
      } finally {
        if (!ignore) setDetailRoleLoading(false);
      }
    };
    loadData();

    return () => {
      ignore = true;
    };
  }, [
    fetchRolesOrgs,
    id,
    userById.data,
    userById.error,
    userById.loading,
    userDetail,
    switchOrgs,
  ]);

  const detailError = Boolean(userById.error);
  const isInitialLoading =
    userById.loading ||
    detailRoleLoading ||
    (!detailReady && !detailError);

  const retryDetail = () => {
    setDetailReady(false);
    userById.refetch();
    refetchUserDetail();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleOrgChange = async (rowMember: number, orgId: string) => {
    const newList = [...memberships];
    newList[rowMember] = {
      orgId,
      roleId: "",
    };
    setMemberships(newList);

    if (orgId && !rolesByOrg[orgId]) {
      const data = await fetchRolesOrgs(orgId);
      const normalized = normalizeRolesList(data);
      setRolesByOrg((prev) => ({
        ...prev,
        [orgId]: normalized,
      }));
    }
  };

  const handleRoleChange = (rowMember: number, roleId: string) => {
    const newList = [...memberships];
    newList[rowMember] = {
      ...newList[rowMember],
      roleId,
    };
    setMemberships(newList);
  };

  const addMembership = () => {
    if (memberships.length >= 5) {
      toast.warning("Too many Organizations & Roles selected.");
      return;
    }
    setMemberships([...memberships, { orgId: "", roleId: "" }]);
  };

  const removeMembership = (rowMember: number) => {
    setMemberships(memberships.filter((_, i) => i !== rowMember));
  };

  // Submit form
  const handleSubmit = async () => {
    const nextErrors = validateUpdateUserForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.warning("Please check the highlighted fields");
      return;
    }

    // Validate normal memberships
    for (let i = 0; i < memberships.length; i++) {
      const m = memberships[i];
      if (m.orgId && !m.roleId) {
        toast.warning("Please select a role for each selected organization.");
        return;
      }
      if (!m.orgId && m.roleId) {
        toast.warning("Please select an organization for each selected role.");
        return;
      }
    }

    const validMemberships = memberships.filter((m) => m.orgId && m.roleId);

    // Prevent duplicate organizations across normal memberships and owner memberships
    const ownerOrgIds = owners.map((o) => o.orgId).filter(Boolean);
    for (const m of validMemberships) {
      if (ownerOrgIds.includes(m.orgId)) {
        toast.warning("User is already an Owner of this organization.");
        return;
      }
    }

    const normalOrgIds = validMemberships.map((m) => m.orgId);
    if (new Set(normalOrgIds).size !== normalOrgIds.length) {
      toast.warning("Each organization can only be added once.");
      return;
    }

    // Combine owner memberships with valid normal memberships so Owner status is preserved on backend
    const ownerMembershipsToSend: Membership[] = owners
      .filter((o) => o.orgId && o.roleId)
      .map((o) => ({
        orgId: o.orgId!,
        roleId: o.roleId!,
      }));

    const finalMemberships: Membership[] = [
      ...ownerMembershipsToSend,
      ...validMemberships,
    ];

    setUiLoading(true);
    const success = await updateUser(id, {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      memberships: finalMemberships,
    });

    if (success) {
      toast.success("Update User Successfully");
      onClose();
      onSuccess();
    }
    await sleep(2000);
    setUiLoading(false);
  };

  return createPortal(
    <div className={`popup-overlay ${popupThemeClass}`} onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/fluency-systems-filled/48/edit-user.png"
                alt="edit-user"
              />
            </div>
            <h2>Edit User</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* FORM */}
        {detailError ? (
          <AdminModalError onRetry={retryDetail} />
        ) : isInitialLoading ? (
          <AdminModalLoading />
        ) : (
        <form
          id={UPDATE_USER_FORM_ID}
          className="popup-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* FULL NAME */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              aria-invalid={Boolean(errors.phoneNumber)}
            />
            {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
          </div>

          {/* OWNER CARD SECTION */}
          {owners.length > 0 && (
            <div className="form-group full-width owner-section">
              <label>Owner</label>
              <div className="owner-card-list">
                {owners.map((owner, idx) => (
                  <div key={idx} className="owner-card" title={`Owner · ${owner.orgName}`}>
                    <div className="owner-card__icon-wrapper" aria-hidden="true">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="owner-card__content">
                      <span className="owner-card__role">{owner.roleName || "Owner"}</span>
                      <span className="owner-card__divider" aria-hidden="true">·</span>
                      <span className="owner-card__org">{owner.orgName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEMBERSHIP */}
          <div className="form-group full-width">
            <label>Organizations & Roles</label>

            {memberships.map((m, rowMember) => (
              <div className="membership-row" key={rowMember}>
                {/* ORG */}
                <Select
                  className="react-select"
                  classNamePrefix="custom-select"
                  placeholder="Select organization..."
                  isSearchable
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                  }}
                  options={availableOrgs.map((o) => ({
                    value: o.id,
                    label: o.name,
                    type: "org",
                  }))}
                  value={
                    availableOrgs
                      .map((o) => ({
                        value: o.id,
                        label: o.name,
                        type: "org",
                      }))
                      .find((o) => o.value === m.orgId) || null
                  }
                  filterOption={(option, inputValue) => {
                    return option.label
                      .toLowerCase()
                      .includes(inputValue.toLowerCase());
                  }}
                  onChange={(selected: any) =>
                    handleOrgChange(rowMember, selected?.value || "")
                  }
                />

                {/* ROLE */}
                <Select
                  className="react-select"
                  classNamePrefix="custom-select"
                  placeholder="Select role..."
                  isSearchable
                  isDisabled={!m.orgId}
                  options={(rolesByOrg[m.orgId] || [])
                    .filter((r: any) => !isOwnerRole(r))
                    .map((r: any) => ({
                      value: r.id,
                      label: r.role_name || r.name || r.role_code || "Role",
                      type: "role",
                    }))}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                  }}
                  value={
                    (rolesByOrg[m.orgId] || [])
                      .filter((r: any) => !isOwnerRole(r))
                      .map((r: any) => ({
                        value: r.id,
                        label: r.role_name || r.name || r.role_code || "Role",
                        type: "role",
                      }))
                      .find((r: any) => r.value === m.roleId) || null
                  }
                  filterOption={(option, inputValue) => {
                    return option.label
                      .toLowerCase()
                      .includes(inputValue.toLowerCase());
                  }}
                  onChange={(selected: any) =>
                    handleRoleChange(rowMember, selected?.value || "")
                  }
                />

                {/* REMOVE */}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeMembership(rowMember)}
                >
                  ✕
                </button>
              </div>
            ))}
            {memberships.length < 5 && (
              <div className="add-org-content">
                <button
                  type="button"
                  className="add-btn-org"
                  onClick={addMembership}
                >
                  <span className="add-icon-org">+</span>Add Organization
                </button>
              </div>
            )}
          </div>
        </form>
        )}

        {/* FOOTER */}
        {detailReady && !detailError && (
          <div className="popup-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form={UPDATE_USER_FORM_ID} disabled={uiLoading}>
              {uiLoading ? "Save Changes..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
