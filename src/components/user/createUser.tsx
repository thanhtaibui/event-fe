import { useState } from "react";
import { createPortal } from "react-dom";
import { useCreateUser } from "../../hooks/admin/user/useCreate";
import "../../styles/popup/popup.css";
import { toast } from "react-toastify";
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

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !form.email ||
      !form.password ||
      !form.email ||
      !form.password ||
      !form.fullName
    ) {
      toast.warning("Please fill all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.warning("Password not match");
      return;
    }
    setUiLoading(true);
    const success = await createUser({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      phoneNumber: form.phoneNumber,
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
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="required">Email</label>
            <input name="email" placeholder="Email" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="required">Phone Number</label>
            <input
              name="phoneNumber"
              placeholder="Phone Number"
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="required">Password</label>
            <input
              type="password"
              placeholder="Password123"
              name="password"
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="required">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Password123"
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
