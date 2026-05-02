import { useState } from "react";
import { createPortal } from "react-dom";
import { useCreateOrg } from "../../hooks/admin/org/useCreate";
import type { PayloadOrganizationDto } from "../../types/organization/create";
import { useUser } from "../../hooks/admin/user/useUser";
import "../../styles/layout/popup.css";
import { toast } from "react-toastify";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import Select from "react-select";

export const CreateOrgPopup = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { createOrg } = useCreateOrg();
  const [uiLoading, setUiLoading] = useState(false);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const [form, setForm] = useState<Partial<PayloadOrganizationDto>>({
    name: "",
    slug: "",
    bio: "",
    ownerId: "",
    legalName: "",
    industry: "",
    address: "",
    email: "",
    phone: "",
    website: "",
  });

  const { data: usersData } = useUser();
  const users = usersData?.items ?? [];

  const convertToSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev: Partial<PayloadOrganizationDto>) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    const slug = convertToSlug(nameValue);
    setForm((prev: Partial<PayloadOrganizationDto>) => ({
      ...prev,
      name: nameValue,
      slug,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.ownerId || !form.industry) {
      toast.warning("Please fill required fields");
      return;
    }

    setUiLoading(true);
    const success = await createOrg({
      ...form,
      bio: form.bio || null,
    } as PayloadOrganizationDto);
    if (success) {
      toast.success("Create organization successfully");
      onClose();
      onSuccess();
    }
    await sleep(2000);
    setUiLoading(false);
  };

  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="25"
                height="25"
                src="https://img.icons8.com/ios-glyphs/30/add-user-male.png"
                alt="add-user-male"
              />
            </div>
            <h2>Create Organization</h2>
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
          <div className="header-label purple">
            <div className="icon-wrapper">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/fluency-systems-regular/48/circled-i.png"
                alt="circled-i"
              />
            </div>
            <span>General Details</span>
          </div>

          {/* 1. Org Name */}
          <div className="form-group">
            <label className="required">Org Name</label>
            <input
              name="name"
              placeholder="Org Name"
              value={form.name || ""}
              onChange={handleNameChange}
              required
            />
          </div>

          {/* 2. Slug (Tự động điền) */}
          <div className="form-group">
            <label className="required">Slug</label>
            <input
              name="slug"
              placeholder="slug-auto"
              value={form.slug}
              onChange={handleChange}
              readOnly
              style={{
                backgroundColor: "#f5f5f5",
                cursor: "not-allowed",
                userSelect: "none",
              }}
            />
          </div>
          {/* 4. Owner ID (Dùng Select) */}
          <div className="form-group-select-full">
            <label className="required">Owner</label>
            <Select
              className="react-select"
              classNamePrefix="custom-select"
              placeholder="Select organization..."
              options={users?.map((u: any) => ({
                value: u.id,
                label: u.fullName,
                email: u.email,
                type: "user",
              }))}
              onChange={(selected: any) =>
                setForm((prev: Partial<PayloadOrganizationDto>) => ({
                  ...prev,
                  ownerId: selected?.value || "",
                }))
              }
              components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue,
              }}
            />
          </div>
          {/* 3. Bio (Dùng Textarea thay vì Input) */}
          <div className="form-group-textarea">
            <label>Bio</label>
            <textarea
              name="bio"
              placeholder="Enter organization bio..."
              rows={4}
              value={form.bio || ""}
              onChange={handleChange}
              className="form-control-textarea"
            />
          </div>
          <div className="header-label blue">
            <div className="icon-wrapper">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/ink/48/building.png"
                alt="building"
              />
            </div>
            <span>Legal & Industry</span>
          </div>
          {/* 4. New optional fields */}
          <div className="form-group">
            <label>Legal Name</label>
            <input
              name="legalName"
              placeholder="Legal name of organization"
              value={form.legalName || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Industry</label>
            <input
              name="industry"
              placeholder="e.g. Technology, Finance"
              value={form.industry || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              name="address"
              placeholder="Organization address"
              value={form.address || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="contact@example.com"
              value={form.email || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              name="phone"
              type="tel"
              placeholder="+1-234-567-8900"
              value={form.phone || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              name="website"
              type="url"
              placeholder="https://example.com"
              value={form.website || ""}
              onChange={handleChange}
            />
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
