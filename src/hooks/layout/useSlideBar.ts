
import { useState, useEffect, useCallback } from "react";

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar") === "true";
  });

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", isCollapsed.toString());
  }, [isCollapsed]);

  return {
    isCollapsed,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  };
};