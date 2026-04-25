import { Breadcrumb } from "../../components/layout/Breadcrumb";
import { useHeader } from "../../hooks/layout/useHeader.ts";
import { useInfo } from "../../hooks/layout/useInfo.ts";

export const Header = () => {
  const title = useHeader();
  const userInfo = useInfo();
  return (
    <header className="admin-header">
      <div className="header-left">
        <Breadcrumb />
        <h3>{title}</h3>
      </div>
      <div className="header-right">
        <div className="round-button">
          <img
            src="https://img.icons8.com/ios/50/appointment-reminders--v1.png"
            alt="appointment-reminders--v1"
          />
        </div>
        <div className="round-button">
          <img
            src="https://img.icons8.com/ios/50/settings--v1.png"
            alt="settings--v1"
          />
        </div>
        <div className="user-info">
          <img src="https://i.pravatar.cc/40" alt="avatar" className="avatar" />
          <div className="user-text">
            <div className="name">{userInfo?.fullName || "Admin"}</div>
            <div className="role">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
