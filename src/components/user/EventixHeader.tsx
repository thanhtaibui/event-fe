import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Ticket,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/auth/AuthProvider";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import { useInfo } from "../../hooks/layout/useInfo";
import type { UserMembership } from "../../types/user/user";
import {
  getOrgWorkspaceRoleLabel,
  getUserPermissionCodes,
  isSuperAdmin as checkSuperAdmin,
} from "../../config/adminPermissionConfig";
import { clearAccessToken, getAccessToken } from "../../constants/authStorage";
import { useOrgsByUser } from "../../hooks/admin/org/useOrgsByUser";
import NotificationMenu from "../common/NotificationMenu";
import "../../styles/user/layout/eventixHeader.css";

const NAV_ITEMS = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Events", href: "/app/events", icon: CalendarDays },
  { label: "Organizations", href: "/app/organizations", icon: Building2 },
  { label: "My Tickets", href: "/app/tickets", icon: Ticket },
] as const;

function persistTheme(next: string) {
  try {
    localStorage.setItem("eventix-theme", next);
  } catch {
    return;
  }
}

function getInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "U";

  const parts = cleaned.includes("@")
    ? [cleaned.split("@")[0]]
    : cleaned.split(/\s+/);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeMemberships(value: unknown): UserMembership[] {
  if (Array.isArray(value)) return value as UserMembership[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const arrayKeys = [
      "items",
      "organizations",
      "memberships",
      "membership",
      "orgs",
      "roles",
    ];

    for (const key of arrayKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key] as UserMembership[];
      }
    }

    if (payload.data && typeof payload.data === "object") {
      return normalizeMemberships(payload.data);
    }
  }

  return [];
}

function getMembershipOrgName(membership: UserMembership) {
  return (
    membership.organization?.name ||
    membership.name ||
    membership.orgName ||
    membership.organizationName ||
    "Organization"
  );
}

function getMembershipOrgSlug(membership: UserMembership) {
  return (
    membership.organization?.slug ||
    membership.slug ||
    membership.orgSlug ||
    membership.organizationSlug ||
    ""
  );
}

function getMembershipHref(membership: UserMembership) {
  const slug = getMembershipOrgSlug(membership);
  return slug ? `/org/${slug}` : "/app/organizations";
}

function getMembershipOrgVerified(membership: UserMembership) {
  const org = membership.organization;
  const candidate = membership as UserMembership & {
    isVerified?: boolean;
    isve?: boolean;
    verified?: boolean;
    verifiedBadge?: boolean;
    verified_badge?: boolean;
  };

  return Boolean(
    org?.isVerified ||
      org?.isve ||
      candidate.isVerified ||
      candidate.isve ||
      candidate.verified ||
      candidate.verifiedBadge ||
      candidate.verified_badge,
  );
}

export default function EventixHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const userInfo = useInfo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string>(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("eventix-theme")) ||
      "dark",
  );

  const activeLabel = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith("/app/events")) return "Events";
    if (pathname.startsWith("/app/organizations")) return "Organizations";
    if (pathname.startsWith("/app/tickets")) return "My Tickets";
    return "Home";
  }, [location.pathname]);

  const currentUser = useMemo(() => {
    if (!isLoggedIn) return null;

    const token = getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayloadCustom>(token);
      const name = decoded.fullName || decoded.email || "User";

      return {
        id: decoded.sub,
        name,
        initials: getInitials(name),
      };
    } catch {
      return null;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    queueMicrotask(() => setWorkspaceOpen(false));
  }, [location.pathname]);

  useEffect(() => {
    if (!workspaceOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        workspaceRef.current &&
        !workspaceRef.current.contains(event.target as Node)
      ) {
        setWorkspaceOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [workspaceOpen]);

  const { data: membershipData, loading: membershipLoading } = useOrgsByUser(
    currentUser?.id || "",
  );

  const memberships = useMemo<UserMembership[]>(() => {
    return normalizeMemberships(membershipData);
  }, [membershipData]);

  const isSuperAdmin = useMemo(() => {
    return checkSuperAdmin(getUserPermissionCodes(userInfo));
  }, [userInfo]);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setWorkspaceOpen(false);
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    persistTheme(next);
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { theme: next } }),
    );
  };
  const handleLogout = () => {
    clearAccessToken();
    setIsLoggedIn(false);
    setWorkspaceOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <header
      className={`user-eventixHeader ${theme === "light" ? "user-eventixHeader--light" : ""}`}
    >
      <div className="user-eventixHeader__inner">
        <Link
          className="user-eventixHeader__brand"
          to="/app"
          aria-label="Eventix brand"
        >
          <span className="user-eventixHeader__logo" aria-hidden="true">
            <img src="/logo-event.png" alt="" />
          </span>
          <span className="user-eventixHeader__brandText">
            <span className="user-eventixHeader__brandName">Eventix</span>
            <span className="user-eventixHeader__brandSub">Community OS</span>
          </span>
        </Link>

        <nav
          className="user-eventixHeader__nav"
          aria-label="Primary navigation"
        >
          <ul className="user-eventixHeader__navList">
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === activeLabel;
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`user-eventixHeader__navLink ${isActive ? "user-eventixHeader__navLink--active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeMobileMenu}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                    <span
                      className="user-eventixHeader__navUnderline"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className="user-eventixHeader__actions"
          aria-label="Header actions"
        >
          <div className="user-eventixHeader__desktopActions">
            <NotificationMenu
              className="user-eventixHeader__notificationMenu"
              variant="user"
              enabled={isLoggedIn}
            />
            {currentUser ? (
              <div className="user-eventixHeader__workspace" ref={workspaceRef}>
                <button
                  type="button"
                  className="user-eventixHeader__userPill"
                  aria-label={`Open workspaces for ${currentUser.name}`}
                  aria-expanded={workspaceOpen}
                  onClick={() => setWorkspaceOpen((open) => !open)}
                >
                  <span className="user-eventixHeader__userAvatar">
                    {currentUser.initials}
                  </span>
                  <span className="user-eventixHeader__userName">
                    {currentUser.name}
                  </span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>

                <div
                  className={`user-eventixHeader__workspaceMenu ${
                    workspaceOpen
                      ? "user-eventixHeader__workspaceMenu--open"
                      : ""
                  }`}
                >
                  <div className="user-eventixHeader__workspaceHead">
                    <span>My Organizations</span>
                  </div>
                  <div className="user-eventixHeader__workspaceList">
                    {isSuperAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="user-eventixHeader__membershipCard"
                        onClick={() => setWorkspaceOpen(false)}
                      >
                        <span className="user-eventixHeader__membershipIcon">
                          <ShieldCheck size={18} aria-hidden="true" />
                        </span>
                        <span className="user-eventixHeader__membershipText">
                          <strong>Super Admin</strong>
                          <small>Super Admin role</small>
                        </span>
                        <ChevronRight
                          className="user-eventixHeader__membershipArrow"
                          size={16}
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                    {membershipLoading && (
                      <div className="user-eventixHeader__membershipSkeleton" aria-label="Loading memberships">
                        <span />
                        <div>
                          <i />
                          <small />
                        </div>
                      </div>
                    )}
                    {!membershipLoading &&
                      memberships.map((membership, index) => {
                        const orgName = getMembershipOrgName(membership);
                        const roleLabel = getOrgWorkspaceRoleLabel(
                          membership,
                          currentUser.id,
                        );
                        const verified = getMembershipOrgVerified(membership);
                        const key =
                          membership.orgId ||
                          membership.organizationId ||
                          membership.id ||
                          membership.organization?.id ||
                          getMembershipOrgSlug(membership) ||
                          `${orgName}-${index}`;
                        return (
                          <Link
                            key={key}
                            to={getMembershipHref(membership)}
                            className="user-eventixHeader__membershipCard"
                            onClick={() => setWorkspaceOpen(false)}
                          >
                            <span className="user-eventixHeader__membershipIcon">
                              <Building2 size={18} aria-hidden="true" />
                            </span>
                            <span className="user-eventixHeader__membershipText">
                              <strong>{orgName}</strong>
                              <small>
                                <span>{roleLabel}</span>
                                {verified && (
                                  <span className="user-eventixHeader__verifiedMini">
                                    Verified
                                  </span>
                                )}
                              </small>
                            </span>
                            <ChevronRight
                              className="user-eventixHeader__membershipArrow"
                              size={16}
                              aria-hidden="true"
                            />
                          </Link>
                        );
                      })}
                    {!membershipLoading &&
                      !isSuperAdmin &&
                      memberships.length === 0 && (
                        <div className="user-eventixHeader__workspaceEmpty">
                          No organization membership yet.
                        </div>
                      )}
                    <button
                      type="button"
                      className="user-eventixHeader__logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="user-eventixHeader__btn user-eventixHeader__btn--ghost"
                  aria-label="Login"
                >
                  Login
                </Link>
                <Link
                  to="/app/events"
                  className="user-eventixHeader__btn user-eventixHeader__btn--primary"
                  aria-label="Get Started"
                >
                  Get Started
                </Link>
              </>
            )}
            <button
              type="button"
              className={`user-eventixHeader__themeSwitch ${
                theme === "light"
                  ? "user-eventixHeader__themeSwitch--light"
                  : "user-eventixHeader__themeSwitch--dark"
              }`}
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onClick={toggleTheme}
            >
              <span
                className="user-eventixHeader__themeSwitchGhost"
                aria-hidden="true"
              >
                {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </span>
              <span
                className="user-eventixHeader__themeSwitchKnob"
                aria-hidden="true"
              >
                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="user-eventixHeader__iconButton"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={`user-eventixHeader__backdrop ${mobileOpen ? "user-eventixHeader__backdrop--open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`user-eventixHeader__mobileDrawer ${mobileOpen ? "user-eventixHeader__mobileDrawer--open" : ""}`}
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Mobile navigation"
      >
        <div className="user-eventixHeader__mobileDrawerTop">
          <div className="user-eventixHeader__mobileBrand">
            <span className="user-eventixHeader__logo" aria-hidden="true">
              <img src="/logo-event.png" alt="" />
            </span>
            <span className="user-eventixHeader__brandText">
              <span className="user-eventixHeader__brandName">Eventix</span>
              <span className="user-eventixHeader__brandSub">Community OS</span>
            </span>
          </div>
          <div className="user-eventixHeader__mobileTopActions">
            <button
              type="button"
              className={`user-eventixHeader__themeSwitch ${
                theme === "light"
                  ? "user-eventixHeader__themeSwitch--light"
                  : "user-eventixHeader__themeSwitch--dark"
              }`}
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onClick={toggleTheme}
            >
              <span
                className="user-eventixHeader__themeSwitchGhost"
                aria-hidden="true"
              >
                {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </span>
              <span
                className="user-eventixHeader__themeSwitchKnob"
                aria-hidden="true"
              >
                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
              </span>
            </button>
            <button
              type="button"
              className="user-eventixHeader__close"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <ul className="user-eventixHeader__mobileNavList">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === activeLabel;
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`user-eventixHeader__mobileNavLink ${isActive ? "user-eventixHeader__mobileNavLink--active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="user-eventixHeader__mobileCtas">
          {currentUser ? (
            <div className="user-eventixHeader__mobileWorkspace">
              <div className="user-eventixHeader__userPill user-eventixHeader__userPill--mobile">
                <span className="user-eventixHeader__userAvatar">
                  {currentUser.initials}
                </span>
                <span className="user-eventixHeader__userName">
                  {currentUser.name}
                </span>
              </div>
              <div className="user-eventixHeader__mobileWorkspaceList">
                {isSuperAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="user-eventixHeader__membershipCard"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="user-eventixHeader__membershipIcon">
                      <ShieldCheck size={18} aria-hidden="true" />
                    </span>
                    <span className="user-eventixHeader__membershipText">
                      <strong>Super Admin</strong>
                      <small>Super Admin role</small>
                    </span>
                    <ChevronRight
                      className="user-eventixHeader__membershipArrow"
                      size={16}
                      aria-hidden="true"
                    />
                  </Link>
                )}
                {membershipLoading && (
                  <div className="user-eventixHeader__membershipSkeleton" aria-label="Loading memberships">
                    <span />
                    <div>
                      <i />
                      <small />
                    </div>
                  </div>
                )}
                {!membershipLoading &&
                  memberships.map((membership, index) => {
                    const orgName = getMembershipOrgName(membership);
                    const roleLabel = getOrgWorkspaceRoleLabel(
                      membership,
                      currentUser.id,
                    );
                    const verified = getMembershipOrgVerified(membership);
                    const key =
                      membership.orgId ||
                      membership.organizationId ||
                      membership.id ||
                      membership.organization?.id ||
                      getMembershipOrgSlug(membership) ||
                      `${orgName}-${index}`;
                    return (
                      <Link
                        key={key}
                        to={getMembershipHref(membership)}
                        className="user-eventixHeader__membershipCard"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="user-eventixHeader__membershipIcon">
                          <Building2 size={18} aria-hidden="true" />
                        </span>
                        <span className="user-eventixHeader__membershipText">
                          <strong>{orgName}</strong>
                          <small>
                            <span>{roleLabel}</span>
                            {verified && (
                              <span className="user-eventixHeader__verifiedMini">
                                Verified
                              </span>
                            )}
                          </small>
                        </span>
                        <ChevronRight
                          className="user-eventixHeader__membershipArrow"
                          size={16}
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                {!membershipLoading &&
                  !isSuperAdmin &&
                  memberships.length === 0 && (
                    <div className="user-eventixHeader__workspaceEmpty">
                      No organization membership yet.
                    </div>
                  )}
                <button
                  type="button"
                  className="user-eventixHeader__logout user-eventixHeader__logout--mobile"
                  onClick={handleLogout}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="user-eventixHeader__btn user-eventixHeader__btn--ghost"
                aria-label="Login"
              >
                Login
              </Link>
              <Link
                to="/app/events"
                className="user-eventixHeader__btn user-eventixHeader__btn--primary"
                aria-label="Get Started"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
