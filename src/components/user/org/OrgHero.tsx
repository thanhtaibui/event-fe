import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

interface OrgHeroProps {
  searchValue: string;
  totalOrgs?: number;
  activeOrgs?: number;
  onSearchChange: (value: string) => void;
}

export default function OrgHero({
  searchValue,
  onSearchChange,
}: OrgHeroProps) {
  return (
    <section className="org-hero" aria-labelledby="org-directory-title">
      {/* LEFT: Discover Organizations & Search */}
      <div className="org-hero__left">
        <h1 className="org-hero__title" id="org-directory-title">
          Discover Organizations
        </h1>
        <p className="org-hero__subtitle">
          Find communities, companies and organizations on Eventix that host amazing events and bring people together.
        </p>

        <div className="org-hero__search-bar" role="search">
          <label className="org-hero__search-input">
            <Search className="org-hero__search-icon" size={18} aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              placeholder="Search organizations, owners, or topics..."
              aria-label="Search organizations, owners, or topics..."
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        <div className="org-hero__cta-row">
          <Link to="/register-organization" className="org-hero__become-btn">
            <span>Become an Organizer</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* RIGHT: Supporting Graphic */}
      <div className="org-hero__support-graphic" aria-hidden="true">
        <img
          src="/org-hero-badge.png"
          alt="Organizations Community Hub"
          className="org-hero__support-image"
        />
      </div>
    </section>
  );
}

