import {
  Building2,
  CheckCircle2,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { OrgRequestStatus } from "../../../types/enum";

interface OrgHeroProps {
  searchValue: string;
  statusValue: string;
  totalOrgs: number;
  activeOrgs: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const statusOptions: Array<"ALL" | OrgRequestStatus> = [
  "ALL",
  "PENDING",
  "ACTIVE",
  "ARCHIVED",
  "SUSPENDED",
  "REJECTED",
];

export default function OrgHero({
  searchValue,
  statusValue,
  totalOrgs,
  activeOrgs,
  onSearchChange,
  onStatusChange,
}: OrgHeroProps) {
  const pendingOrgs = Math.max(totalOrgs - activeOrgs, 0);

  return (
    <section className="org-hero">
      <div className="org-hero__content">
        <p className="org-hero__eyebrow">Organization Directory</p>
        <h1 className="org-hero__title">
          Explore trusted
          <span className="org-hero__title--accent">
            community builders
          </span>
        </h1>
        <p className="org-hero__subtitle">
          Find organizations shaping the Eventix network, compare their status,
          and discover the teams behind every community experience.
        </p>

        <div className="org-hero__search-grid">
          <div className="org-hero__search-item">
            <Search className="org-hero__search-icon" size={18} aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              placeholder="Search name, owner, bio..."
              aria-label="Search organizations"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="org-hero__search-item">
            <ShieldCheck className="org-hero__search-icon" size={18} aria-hidden="true" />
            <select
              value={statusValue}
              aria-label="Filter organization status"
              onChange={(event) => onStatusChange(event.target.value)}
            >
              {statusOptions.map((status) => (
                <option value={status} key={status}>
                  {status === "ALL" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>
          <button className="org-hero__search-btn" type="button">
            Search
          </button>
          <Link className="org-hero__search-btn org-hero__register-btn" to="/register-organization">
            Register Org
          </Link>
        </div>
      </div>

      <div className="org-hero__visual" aria-label="Organization community illustration">
        <img
          className="org-hero__image"
          src="/org-hero-community.png"
          alt={`Community workspace with ${totalOrgs} organizations and ${activeOrgs} active profiles`}
        />
        <div className="org-hero__stats" aria-hidden="true">
          <div className="org-hero__stat org-hero__stat--primary">
            <Building2 size={18} />
            <span>Total orgs</span>
            <strong>{totalOrgs}</strong>
          </div>
          <div className="org-hero__stat">
            <CheckCircle2 size={18} />
            <span>Active</span>
            <strong>{activeOrgs}</strong>
          </div>
          <div className="org-hero__stat">
            <UsersRound size={18} />
            <span>Review queue</span>
            <strong>{pendingOrgs}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
