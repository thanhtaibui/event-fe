import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import "../../styles/user/eventixHeader.css";

const NAV_ITEMS = [
  { label: "Product", href: "/events" },
  { label: "Solutions", href: "/events" },
  { label: "Resources", href: "/events" },
  { label: "Pricing", href: "/events" },
  { label: "Company", href: "/events" },
] as const;

type NavItemLabel = (typeof NAV_ITEMS)[number]["label"];

type NavState = {
  activeLabel: NavItemLabel;
};

export default function EventixHeader() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initialNav = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith("/events"))
      return { activeLabel: "Product" as const };
    return { activeLabel: "Product" as const };
  }, [location.pathname]);

  const [nav, setNav] = useState<NavState>(initialNav);

  useEffect(() => {
    setNav(initialNav);
  }, [initialNav]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const onNavClick = (label: NavItemLabel) => {
    setNav({ activeLabel: label });
    setMobileOpen(false);
  };

  return (
    <header
      className={
        "user-eventixHeader" +
        (scrolled
          ? " user-eventixHeader--scrolled"
          : " user-eventixHeader--top")
      }
    >
      <div className="user-eventixHeader__inner">
        <div className="user-eventixHeader__brand" aria-label="Eventix brand">
          <span className="user-eventixHeader__logo" aria-hidden="true" />
          <span className="user-eventixHeader__brandName">Eventix</span>
        </div>

        <nav className="user-eventixHeader__nav" aria-label="Primary">
          <ul className="user-eventixHeader__navList">
            {NAV_ITEMS.map((item) => {
              const active = nav.activeLabel === item.label;
              return (
                <li key={item.label} className="user-eventixHeader__navItem">
                  <Link
                    to={item.href}
                    className={
                      "user-eventixHeader__navLink" +
                      (active ? " user-eventixHeader__navLink--active" : "")
                    }
                    onClick={() => onNavClick(item.label)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="user-eventixHeader__navText">
                      {item.label}
                    </span>
                    <span
                      className="user-eventixHeader__navUnderline"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className="user-eventixHeader__actions"
          aria-label="Header actions"
        >
          <button
            className="user-eventixHeader__iconButton"
            aria-label="Open menu"
            type="button"
            onClick={() => setMobileOpen(true)}
          >
            <span
              className="user-eventixHeader__hamburger"
              aria-hidden="true"
            />
          </button>

          <div className="user-eventixHeader__desktopActions">
            <Link
              to="/login"
              className="user-eventixHeader__btn user-eventixHeader__btn--ghost"
              aria-label="Login"
            >
              Login
            </Link>
            <Link
              to="/events"
              className="user-eventixHeader__btn user-eventixHeader__btn--primary"
              aria-label="Get Started"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div
        className={
          "user-eventixHeader__mobileDrawer" +
          (mobileOpen ? " user-eventixHeader__mobileDrawer--open" : "")
        }
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Mobile navigation"
      >
        <div className="user-eventixHeader__mobileDrawerTop">
          <div className="user-eventixHeader__mobileBrand">
            <span className="user-eventixHeader__logo" aria-hidden="true" />
            <span className="user-eventixHeader__brandName">Eventix</span>
          </div>
          <button
            type="button"
            className="user-eventixHeader__close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <ul className="user-eventixHeader__mobileNavList">
          {NAV_ITEMS.map((item) => {
            const active = nav.activeLabel === item.label;
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={
                    "user-eventixHeader__mobileNavLink" +
                    (active ? " user-eventixHeader__mobileNavLink--active" : "")
                  }
                  onClick={() => onNavClick(item.label)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="user-eventixHeader__mobileCtas">
          <Link
            to="/login"
            className="user-eventixHeader__btn user-eventixHeader__btn--ghost"
            aria-label="Login"
          >
            Login
          </Link>
          <Link
            to="/events"
            className="user-eventixHeader__btn user-eventixHeader__btn--primary"
            aria-label="Get Started"
          >
            Get Started
          </Link>
        </div>
      </div>

      <button
        type="button"
        className={
          "user-eventixHeader__backdrop" +
          (mobileOpen ? " user-eventixHeader__backdrop--open" : "")
        }
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => setMobileOpen(false)}
      />
    </header>
  );
}
