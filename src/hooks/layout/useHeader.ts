import { useLocation } from "react-router-dom";

export const useHeader = () => {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    dashboard: "Dashboard",
    users: "Users",
    organizations: "Organizations",
    profile: "Organization Profile",
    events: "Events",
    reports: "Reports",
    roles: "Roles",
    membership: "Membership",
    verifications: "Verification Requests",
  };

  const segments = location.pathname.split("/").filter(Boolean);
  const isOrgWorkspace = segments[0] === "org";
  const moduleKey = isOrgWorkspace ? segments[2] : segments[1];

  if (moduleKey === "events" && segments.length > (isOrgWorkspace ? 3 : 2)) {
    return "Event Detail";
  }

  if (moduleKey === "organizations" && segments.length > 2) {
    return "Organization Detail";
  }

  return moduleKey ? titleMap[moduleKey] || "Dashboard" : "Dashboard";
};
