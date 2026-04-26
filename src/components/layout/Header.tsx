import { Breadcrumb } from "../../components/layout/Breadcrumb";
import { useHeader } from "../../hooks/layout/useHeader.ts";
import { useInfo } from "../../hooks/layout/useInfo.ts";
import { Facehash } from "facehash";
// import Avatar from "react-avatar";
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
          <div
            style={{
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            {/* <Avatar
              name={userInfo?.fullName || "Admin"}
              size="48"
              round={true}
              maxInitials={2}
            /> */}
            <Facehash
              style={{ userSelect: "none" }}
              name={userInfo?.fullName || "Admin"}
              size={48}
              colors={["#5917bec2"]}
              enableBlink={true}
            />
          </div>

          <div className="user-text">
            <div className="name">{userInfo?.fullName || "Admin"}</div>
            <div className="role">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
