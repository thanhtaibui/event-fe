import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Organization } from "../../../types/organization/organization";

interface OrgListGridProps {
  items: Organization[];
  loading?: boolean;
  total?: number;
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function OrgLogo({ org }: { org: Organization }) {
  return (
    <span className="org-list__logo org-list__logo--fallback">
      {org.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function getStatusClass(status: string) {
  return `org-list__status org-list__status--${status.toLowerCase()}`;
}

function isOrgVerified(org: Organization) {
  const candidate = org as Organization & {
    isVerified?: boolean;
    isve?: boolean;
    verified?: boolean;
    verifiedBadge?: boolean;
    verified_badge?: boolean;
  };

  return Boolean(
    candidate.isVerified ||
      candidate.isve ||
      candidate.verified ||
      candidate.verifiedBadge ||
      candidate.verified_badge
  );
}

function OrgListSkeleton() {
  return (
    <div className="org-list__grid org-list__grid--skeleton" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <article className="org-list__card org-list__skeletonCard" key={index}>
          <div className="org-list__skeletonTop">
            <span className="org-list__skeletonBlock org-list__skeletonLogo" />
            <span className="org-list__skeletonBlock org-list__skeletonBadge" />
          </div>
          <span className="org-list__skeletonBlock org-list__skeletonTitle" />
          <span className="org-list__skeletonBlock org-list__skeletonText" />
          <span className="org-list__skeletonBlock org-list__skeletonText org-list__skeletonText--short" />
          <span className="org-list__skeletonBlock org-list__skeletonOwner" />
          <div className="org-list__skeletonFooter">
            <span className="org-list__skeletonBlock org-list__skeletonPill" />
            <span className="org-list__skeletonBlock org-list__skeletonDate" />
          </div>
          <span className="org-list__skeletonBlock org-list__skeletonButton" />
        </article>
      ))}
    </div>
  );
}

export default function OrgListGrid({ items, loading = false, total = 0 }: OrgListGridProps) {
  return (
    <section className="org-list">
      <div className="org-list__header">
        <div>
          <span className="org-list__kicker">Community network</span>
          <h2>All Organizations</h2>
          <p>
            Showing {items.length} of {total || items.length} organizations
          </p>
        </div>
        <div className="org-list__sort">
          <label htmlFor="sort-by">Sort by:</label>
          <select id="sort-by">
            <option>Popular</option>
            <option>Newest</option>
            <option>Members</option>
          </select>
        </div>
      </div>

      {loading && <OrgListSkeleton />}

      {!loading && items.length === 0 && (
        <div className="org-list__state">No organizations found.</div>
      )}

      {!loading && <div className="org-list__grid">
        {items.map((org) => {
          const verified = isOrgVerified(org);

          return (
            <article key={org.id} className="org-list__card">
              <div className="org-list__card-head">
                <div className="org-list__card-top">
                  <OrgLogo org={org} />
                  {verified && (
                    <BadgeCheck className="org-list__verified" size={16} aria-label="Verified" />
                  )}
                </div>
                <div className="org-list__title-row">
                  <h3>{org.name}</h3>
                </div>
              </div>
              <p className="org-list__description">
                {org.bio || "This organization has not added a public bio yet."}
              </p>
              <div className="org-list__owner">
                <MapPin size={15} aria-hidden="true" />
                <span>{org.owner?.fullName || "Unknown owner"}</span>
              </div>
              <div className="org-list__metrics">
                <span className={getStatusClass(org.status)}>{org.status}</span>
                <span>{formatDate(org.createdAt)}</span>
              </div>
              <Link className="org-list__view-btn" to={`/app/organizations/${org.slug}`}>
                View Organization
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>}

      {total > items.length && <div className="org-list__pagination">
        <button aria-label="Previous page">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button className="active">1</button>
        <button>2</button>
        <button>3</button>
        <span>...</span>
        <button>21</button>
        <button aria-label="Next page">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>}
    </section>
  );
}
