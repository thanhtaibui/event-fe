import "../../../styles/layout/layout.css";
import { SidebarItem } from "./SlideBarItem";
type SidebarProps = {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
};
export const Sidebar = ({ isCollapsed, onToggleSidebar }: SidebarProps) => {
  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button className="toggle-btn" onClick={onToggleSidebar}>
        {isCollapsed ? (
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/25/forward.png"
            alt="back"
          />
        ) : (
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/30/back.png"
            alt="forward"
          />
        )}
      </button>
      <div className="logo">
        <img src="../../public/logo-new.jpg" alt="event logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          <SidebarItem
            to="/admin/dashboard"
            label="Dashboard"
            icon="https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/control-panel.png"
            activeIcon="https://img.icons8.com/nolan/96/control-panel.png"
            isCollapsed={isCollapsed}
          />

          <SidebarItem
            to="/admin/users"
            label="User"
            icon="https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/test-account.png"
            activeIcon="https://img.icons8.com/nolan/64/test-account.png"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            to="/admin/organizations"
            label="Organizations"
            icon="https://img.icons8.com/nolan/64/B0B0B0/2E2E2E/organization.png"
            activeIcon="https://img.icons8.com/nolan/64/organization.png"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            to="/admin/events"
            label="Events"
            icon="https://img.icons8.com/nolan/64/B0B0B0/2E2E2E/event-accepted.png"
            activeIcon="https://img.icons8.com/nolan/64/event-accepted.png"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            to="/admin/reports"
            label="Reports"
            icon="https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/ratings.png"
            activeIcon="https://img.icons8.com/nolan/64/ratings.png"
            isCollapsed={isCollapsed}
          />

          <SidebarItem
            to="/admin/roles"
            label="Roles"
            icon="https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/user-shield.png"
            activeIcon="https://img.icons8.com/nolan/64/user-shield.png"
            isCollapsed={isCollapsed}
          />
        </ul>
      </nav>
    </aside>
  );
};
