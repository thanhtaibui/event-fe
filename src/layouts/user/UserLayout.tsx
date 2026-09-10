import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import EventixHeader from "../../components/user/EventixHeader";
import UserFooter from "../../components/user/UserFooter";

import "../../styles/user/layout/user-layout.css";

export default function UserLayout() {
  const [theme, setTheme] = useState<string>(
    () =>
      (typeof window !== "undefined" &&
        (localStorage.getItem("eventix-theme") || "dark")) ||
      "dark",
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const nextTheme = (e as CustomEvent).detail?.theme;
      if (nextTheme === "light" || nextTheme === "dark") {
        setTheme(nextTheme);
      }
    };

    window.addEventListener("theme-change", handler as EventListener);
    return () =>
      window.removeEventListener("theme-change", handler as EventListener);
  }, []);

  return (
    <div
      className={`user-layout ${theme === "light" ? "light-mode" : "dark-mode"}`}
    >
      <EventixHeader />
      <main className="user-layout__main">
        <Outlet />
      </main>
      <UserFooter />
    </div>
  );
}
