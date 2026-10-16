import { useState } from "react";
import { createPortal } from "react-dom";
import { useCreateUser } from "../../../hooks/admin/user/useCreate";
import "../../../styles/admin/popup/popup.css";
import { toast } from "react-toastify";

type CreateUserForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
};

type CreateUserErrors = Partial<Record<keyof CreateUserForm, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s.-]{8,18}$/;

function getAdminPopupThemeClass() {
  if (typeof window === "undefined") return "admin-popup-theme--light";
  return localStorage.getItem("eventix-theme") === "dark"
    ? "admin-popup-theme--dark"
    : "admin-popup-theme--light";
}

function validateCreateUserForm(form: CreateUserForm) {
  const errors: CreateUserErrors = {};
  const fullName = form.fullName.trim();
  const email = form.email.trim();
  const phoneNumber = form.phoneNumber.trim();
  const phoneDigits = phoneNumber.replace(/\D/g, "");

  if (!fullName) {
    errors.fullName = "Full name is required";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email format is invalid";
  }

  if (!phoneNumber) {
    errors.phoneNumber = "Phone number is required";
  } else if (!PHONE_PATTERN.test(phoneNumber) || phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phoneNumber = "Phone number must contain 9-15 digits";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Password does not match";
  }

  return errors;
}

export const CreateUserPopup = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { createUser } = useCreateUser();
  const [uiLoading, setUiLoading] = useState(false);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const popupThemeClass = getAdminPopupThemeClass();

  const [form, setForm] = useState<CreateUserForm>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<CreateUserErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateCreateUserForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.warning("Please check the highlighted fields");
      return;
    }

    setUiLoading(true);
    const success = await createUser({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phoneNumber: form.phoneNumber.trim(),
    });
    if (success) {
      toast.success("Create user successfully");
      onClose();
      onSuccess();
    }
    await sleep(2000);
    setUiLoading(false);
  };

  return createPortal(
    <div className={`popup-overlay ${popupThemeClass}`} onClick={onClose}>
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
            <h2>Create User</h2>
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
            <label className="required">Full Name</label>
            <input
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label className="required">Email</label>
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="required">Phone Number</label>
            <input
              name="phoneNumber"
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={handleChange}
              aria-invalid={Boolean(errors.phoneNumber)}
            />
            {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
          </div>
          <div className="form-group">
            <label className="required">Password</label>
            <input
              type="password"
              placeholder="Password123"
              name="password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="required">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Password123"
              value={form.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
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
