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
}: SidebarItemProps) => {
  return (
    <NavLink to={to} aria-label={label} title={label}>
      {({ isActive }) => (
        <li className={isActive ? "active" : ""} data-label={label}>
          <img src={isActive ? activeIcon : icon} alt={label} />
          <span>{label}</span>
        </li>
      )}
    </NavLink>
  );
};
