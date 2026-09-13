import { Facehash } from "facehash";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Moon, Sun } from "lucide-react";
import { clearAccessToken } from "../../../constants/authStorage";
import { getAccessToken } from "../../../constants/authStorage";
import { useAuth } from "../../../hooks/auth/AuthProvider";
import { useOrgBySlug } from "../../../hooks/admin/org/useOrgBySlug";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import { useHeader } from "../../../hooks/layout/useHeader";
import { useInfo } from "../../../hooks/layout/useInfo";
import {
  getOrgWorkspaceRoleLabel,
  getMembershipSlug,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import { Breadcrumb } from "./Breadcrumb";
import NotificationMenu from "../../common/NotificationMenu";
// import Avatar from "react-avatar";
type HeaderProps = {
  theme: string;
  onToggleTheme: () => void;
};

export const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  const title = useHeader();
  const userInfo = useInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { setIsLoggedIn } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const isOrgWorkspace = location.pathname.startsWith("/org/") && Boolean(slug);
  const { data: currentOrg } = useOrgBySlug(isOrgWorkspace ? slug || "" : "");
  const orgName = currentOrg?.data?.name || currentOrg?.name;
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);
  const { data: membershipData } = useOrgsByUser(
    isOrgWorkspace ? currentUserId : "",
  );
  const activeMembership = useMemo(() => {
    if (!isOrgWorkspace || !slug) return null;
    return (
      normalizeUserMemberships(membershipData).find(
        (membership) => getMembershipSlug(membership) === slug,
      ) || null
    );
  }, [isOrgWorkspace, membershipData, slug]);
  const workspaceLabel = isOrgWorkspace
    ? orgName || slug || "Organization"
    : "Admin";
  const roleLabel = isOrgWorkspace
    ? getOrgWorkspaceRoleLabel(activeMembership, currentUserId)
    : "Super Admin";

  const handleLogout = () => {
    clearAccessToken();
    setIsLoggedIn(false);
    setSettingsOpen(false);
    navigate("/login");
  };

  const handleGoOrgProfile = () => {
    if (!slug) return;
    setSettingsOpen(false);
    navigate(`/org/${slug}/profile`);
  };

  const handleBackToUserSite = () => {
    setSettingsOpen(false);
    navigate("/app");
  };

  useEffect(() => {
    if (!settingsOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [settingsOpen]);

  return (
    <header className="admin-header">
      <div className="header-left">
        <Breadcrumb />
        <h3>{title}</h3>
      </div>
      <div className="header-right">
        <button
          type="button"
          className="admin-theme-toggle"
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          onClick={onToggleTheme}
        >
          <span className="admin-theme-toggle__track" aria-hidden="true">
            <span className="admin-theme-toggle__icon admin-theme-toggle__icon--sun">
              <Sun size={15} />
            </span>
            <span className="admin-theme-toggle__icon admin-theme-toggle__icon--moon">
              <Moon size={15} />
            </span>
            <span className="admin-theme-toggle__knob">
              {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
            </span>
          </span>
        </button>
        <NotificationMenu variant="admin" enabled={Boolean(currentUserId)} />
        <div className="admin-settings" ref={settingsRef}>
          <button
            type="button"
            className="user-info admin-account-trigger"
            aria-label="Open account settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <div
              style={{
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
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
              <div className="role">
                <span>{workspaceLabel}</span>
                <span className="admin-header__role-pill">{roleLabel}</span>
              </div>
            </div>
          </button>
          <div
            className={`admin-settings__menu ${
              settingsOpen ? "admin-settings__menu--open" : ""
            }`}
          >
            <div className="admin-settings__head">
              <span>{userInfo?.fullName || "Admin"}</span>
              <small>Account settings</small>
            </div>
            {isOrgWorkspace && (
              <button
                type="button"
                className="admin-settings__item"
                onClick={handleGoOrgProfile}
              >
                Organization Profile
              </button>
            )}
            <button
              type="button"
              className="admin-settings__item"
              onClick={handleBackToUserSite}
            >
              Back to User Site
            </button>
            <button
              type="button"
              className="admin-settings__logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
