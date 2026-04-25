import { useLocation } from "react-router-dom";

export const useHeader = () => {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    dashboard: "Dashboard",
    users: "Users",
    events: "Events",
  };

  const key = Object.keys(titleMap).find((k) =>
    location.pathname.includes(k)
  );

  return key ? titleMap[key] : "Dashboard";
};