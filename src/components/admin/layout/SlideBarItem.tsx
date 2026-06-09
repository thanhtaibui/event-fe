import { NavLink } from "react-router-dom";

type SidebarItemProps = {
  to: string;
  label: string;
  icon: string;
  activeIcon: string;
  isCollapsed: boolean;
};

export const SidebarItem = ({
  to,
  label,
  icon,
  activeIcon,
  isCollapsed,
}: SidebarItemProps) => {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <li className={isActive ? "active" : ""}>
          <img src={isActive ? activeIcon : icon} alt={label} />
          {!isCollapsed && <span>{label}</span>}
        </li>
      )}
    </NavLink>
  );
};
