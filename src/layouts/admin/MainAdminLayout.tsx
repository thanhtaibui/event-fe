import { Outlet } from "react-router-dom";
import { Header } from "../../components/admin/layout/Header";
import { Sidebar } from "../../components/admin/layout/Sidebar";
import "../../styles/index.css";
import "../../styles/layout/layout.css";
import { useSidebar } from "../../hooks/layout/useSlideBar";
import AICreativeChat from "../../components/chat/AIChatBox";

export const MainAdminLayout = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className={`layout-container ${isCollapsed ? "collapsed" : ""}`}>
      <Sidebar isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

      <div className="main-wrapper">
        <Header />

        <main className="content-body">
          <Outlet />
        </main>
        <AICreativeChat />
      </div>
    </div>
  );
};
