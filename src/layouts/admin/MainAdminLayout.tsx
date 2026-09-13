import { Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "../../components/admin/layout/Header";
import { Sidebar } from "../../components/admin/layout/Sidebar";
import "../../styles/index.css";
import "../../styles/admin/layout/layout.css";
import { useSidebar } from "../../hooks/layout/useSlideBar";

const AICreativeChat = lazy(() => import("../../components/chat/AIChatBox"));

const getStoredTheme = () => {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("eventix-theme") === "dark" ? "dark" : "light";
};

export const MainAdminLayout = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [theme, setTheme] = useState<string>(getStoredTheme);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent).detail?.theme;
      if (nextTheme === "light" || nextTheme === "dark") {
        setTheme(nextTheme);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "eventix-theme") {
        setTheme(event.newValue === "dark" ? "dark" : "light");
      }
    };

    window.addEventListener("theme-change", handleThemeChange as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("eventix-theme", nextTheme);
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { theme: nextTheme } }),
    );
  };

  return (
    <div
      className={`layout-container ${
        theme === "dark" ? "dark-mode" : "light-mode"
      } ${isCollapsed ? "collapsed" : ""}`}
    >
      <Sidebar isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

      <div className="main-wrapper">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <main className="content-body">
          <Outlet />
        </main>
        <Suspense fallback={null}>
          <AICreativeChat />
        </Suspense>
      </div>
    </div>
  );
};
