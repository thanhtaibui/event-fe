import "../styles/auth/login.css";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="login-container">
      {/* Wave background */}
      <div className="wave-bg">
        <img src="/Untitled.svg" alt="wave background" />
      </div>

      {/* Content */}
      <div className="login-card">
        <div className="login-left">
          <Outlet />
        </div>

        <div className="login-right">
          <h1>Welcome to EventHub</h1>
          <p>
            Your gateway to unforgettable events. Join, connect and experience
            more. Discover exciting activities, meet new people, and create
            moments that truly matter.
          </p>
        </div>
      </div>
    </div>
  );
}
