import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUpdateUser } from "../../hooks/admin/user/useUpdate";
import { useUserById } from "../../hooks/admin/user/useUserId";
import { useOrgsByUser } from "../../hooks/admin/org/useOrgsByUser";
import "../../styles/layout/popup.css";
import { toast } from "react-toastify";
import { useSwitchOrg } from "../../hooks/admin/org/useSwitchOrg";
import { useRolesOrg } from "../../hooks/admin/role/useRolesOrg";
import type { Membership } from "../../types/membership/membership";
import Select from "react-select";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";

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
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
  });

  const [uiLoading, setUiLoading] = useState(false);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const userById = useUserById(id);

  const { data: userDetail } = useOrgsByUser(id); //lấy ra danh sách org với role của user
  const { data: switchOrgs } = useSwitchOrg(); //danh sách full org của org
  const { fetchRolesOrgs } = useRolesOrg(); //danh sách role full của org
  const [rolesByOrg, setRolesByOrg] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadData = async () => {
      if (userById.data) {
        // console.log("userById.data", userById.data);
        setForm({
          fullName: userById.data.fullName || "",
          phoneNumber: userById.data.phoneNumber || "",
        });
      }
      if (userDetail && Array.isArray(userDetail)) {
        // console.log("userDetail", userDetail);

        const newMemberships = userDetail.map((ud: any) => ({
          orgId: ud?.organizationId,
          roleId: ud?.roleId,
        }));
        // console.log("newMemberships", newMemberships);

        setMemberships(newMemberships);
        const allOrgIds = newMemberships.map((m) => m.orgId).filter(Boolean);
        // Chạy vòng lặp
        for (const orgId of allOrgIds) {
          const data = await fetchRolesOrgs(orgId);
          if (data) {
            setRolesByOrg((prev) => ({
              ...prev,
              [orgId]: data,
            }));
          }
        }
      }
    };
    loadData();
  }, [userDetail, userById.data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // new
  const handleOrgChange = async (rowMember: number, orgId: string) => {
    const newList = [...memberships];
    newList[rowMember].orgId = orgId;
    newList[rowMember].roleId = "";
    setMemberships(newList);
    const data = await fetchRolesOrgs(orgId);
    if (data) {
      setRolesByOrg((prev) => ({
        ...prev,
        [orgId]: data,
      }));
    }
  };

  // useEffect(() => {
  //   console.log("memberships: ", memberships);
  // }, [memberships]);

  const handleRoleChange = (rowMember: number, roleId: string) => {
    //rowMember la sô dòng đang chỉnh
    const newList = [...memberships];
    newList[rowMember].roleId = roleId;
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

  // nút edit
  const handleSubmit = async () => {
    if (
      // !memberships ||
      // memberships.length === 0 ||
      // memberships.some((m) => !m.roleId || !m.orgId) ||
      !form.phoneNumber ||
      !form.fullName
    ) {
      toast.warning("Please fill all fields");
      return;
    }

    setUiLoading(true);
    const success = await updateUser(id, {
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      memberships: memberships,
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
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/external-thin-kawalan-studio/24/external-user-edit-users-thin-kawalan-studio.png"
                alt="user-edit"
              />
            </div>
            <h2>Edit User</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* FORM */}
        <form
          id="popup-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* FULL NAME */}
          <div className="form-group">
            <label>FULL NAME</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>PHONE NUMBER</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

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
                      .find((o: any) => o.value === m.orgId) || null
                  }
                  filterOption={(option, inputValue) => {
                    return option.label
                      .toLowerCase()
                      .includes(inputValue.toLowerCase());
                  }}
                  onChange={(selected: any) =>
                    handleOrgChange(rowMember, selected?.value)
                  }
                />

                {/* ROLE */}
                <Select
                  className="react-select"
                  classNamePrefix="custom-select"
                  placeholder="Select role..."
                  isSearchable
                  isDisabled={!m.orgId}
                  options={(rolesByOrg[m.orgId] || []).map((r: any) => ({
                    value: r.id,
                    label: r.role_name,
                    type: "role",
                  }))}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                  }}
                  value={
                    (rolesByOrg[m.orgId] || [])
                      .map((r: any) => ({
                        value: r.id,
                        label: r.role_name,
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
                    handleRoleChange(rowMember, selected?.value)
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

        {/* FOOTER */}
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
