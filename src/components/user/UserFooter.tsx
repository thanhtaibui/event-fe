import { Link } from "react-router-dom";
import { CalendarDays, Mail, MapPin } from "lucide-react";

import "../../styles/user/layout/user-layout.css";

const footerLinks = [
  { label: "Home", href: "/app" },
  { label: "Events", href: "/app/events" },
  { label: "Organizations", href: "/app/organizations" },
  { label: "My Tickets", href: "/app/tickets" },
] as const;

export default function UserFooter() {
  return (
    <footer className="user-footer">
      <div className="user-footer__inner">
        <div className="user-footer__brand">
          <Link to="/app" className="user-footer__logoLink" aria-label="Eventix">
            <span className="user-footer__logo" aria-hidden="true">
              <img src="/logo-event.png" alt="" />
            </span>
            <span>Eventix</span>
          </Link>
          <p>
            A polished event platform for discovering experiences, growing
            communities, and keeping every ticket in one place.
          </p>
        </div>

        <nav className="user-footer__nav" aria-label="Footer navigation">
          <h2>Explore</h2>
          <div className="user-footer__links">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="user-footer__contact">
          <h2>Stay Connected</h2>
          <p>
            <Mail size={16} aria-hidden="true" />
            hello@eventix.dev
          </p>
          <p>
            <MapPin size={16} aria-hidden="true" />
            Ho Chi Minh City, Viet Nam
          </p>
          <p>
            <CalendarDays size={16} aria-hidden="true" />
            Events updated weekly
          </p>
        </div>
      </div>

      <div className="user-footer__bottom">
        <span>© 2026 Eventix. All rights reserved.</span>
        <span>
          Built for communities
        </span>
      </div>
    </footer>
  );
}
