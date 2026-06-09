import { Outlet } from "react-router-dom";

import EventixHeader from "../../components/user/EventixHeader";

// import UserHeader from "../../components//user/UserHeader";
// import UserFooter from "../../components/user/UserFooter";

import "../../styles/user/user-layout.css";

export default function UserLayout() {
  return (
    <div className="user-layout">
      <EventixHeader />
      <main className="user-layout__main">
        <Outlet />
      </main>
      {/* <UserFooter /> */}
    </div>
  );
}
