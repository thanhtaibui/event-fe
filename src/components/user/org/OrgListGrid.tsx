import { useState } from "react";
import { ArrowRight, CalendarDays, Check, SearchX, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import type { Organization } from "../../../types/organization/organization";

type OrganizationCard = Organization & {
  address?: string | null;
  bannerUrl?: string | null;
  coverUrl?: string | null;
  image_url?: string | null;
  industry?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  events?: any[];
  events_count?: number;
  stats?: {
    totalEvents?: number;
    [key: string]: any;
  } | null;
};

interface OrgListGridProps {
  items: Organization[];
  loading?: boolean;
  total?: number;
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
      candidate.verified_badge,
  );
}

function getOrgIndustry(org: OrganizationCard) {
  if (org.industry && org.industry.trim()) {
    return org.industry.trim();
  }
  const text = `${org.name || ""} ${org.bio || ""} ${org.description || ""}`.toLowerCase();
  if (text.includes("community")) return "Community";
  if (text.includes("tech") || text.includes("software")) return "Technology";
  if (text.includes("student") || text.includes("education") || text.includes("skills")) return "Education";
  if (text.includes("art") || text.includes("music") || text.includes("culture")) return "Culture & Arts";
  if (text.includes("charity") || text.includes("green") || text.includes("climate")) return "Non-Profit";
  return "Community";
}

function getOrgEventsCount(org: OrganizationCard) {
  if (typeof org.totalEvents === "number") {
    return org.totalEvents;
  }
  if (typeof org.events_count === "number") {
    return org.events_count;
  }
  if (Array.isArray(org.events)) {
    return org.events.length;
  }
  if (typeof org.stats?.totalEvents === "number") {
    return org.stats.totalEvents;
  }
  return 1;
}

function formatCreatedDate(value?: string | Date | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function toSlug(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getOrganizationSlug(org: OrganizationCard) {
  const candidate = org as OrganizationCard & {
    orgSlug?: string;
    organizationSlug?: string;
    organization?: { slug?: string; name?: string };
    org?: { slug?: string; name?: string };
  };

  const directSlug =
    candidate.slug ||
    candidate.orgSlug ||
    candidate.organizationSlug ||
    candidate.organization?.slug ||
    candidate.org?.slug;

  if (directSlug && typeof directSlug === "string" && directSlug.trim()) {
    return directSlug.trim();
  }

  const name =
    candidate.name ||
    candidate.organization?.name ||
    candidate.org?.name;

  return toSlug(name) || candidate.id || "";
}

function OrganizationLogoItem({ org }: { org: OrganizationCard }) {
  const [error, setError] = useState(false);
  const logo = org.logo || org.logoUrl;
  const initial = (org.name || "E").slice(0, 1).toUpperCase();

  if (logo && !error) {
    return (
      <img
        src={logo}
        alt={`${org.name} logo`}
        onError={() => setError(true)}
      />
    );
  }

  return <span>{initial}</span>;
}

function OrganizationRowCard({ org }: { org: OrganizationCard }) {
  const verified = isOrgVerified(org);
  const organizationSlug = getOrganizationSlug(org);
  const organizationPath = `/app/organizations/${organizationSlug}`;
  const industry = getOrgIndustry(org);
  const eventsCount = getOrgEventsCount(org);
  const description =
    org.description ||
    org.bio ||
    "Connecting people through inspiring events and shared community goals.";

  return (
    <article className="org-row-card">
      {/* LEFT: Organization logo/avatar */}
      <div className="org-row-card__logo" aria-hidden="true">
        <OrganizationLogoItem org={org} />
      </div>

      {/* MIDDLE: Organization name, Industry, Description, Created date + total events */}
      <div className="org-row-card__content">
        <div className="org-row-card__title-row">
          <h3 className="org-row-card__name" title={org.name}>
            {org.name}
          </h3>
          {verified && (
            <span className="org-row-card__badge-verified" title="Verified organization">
              <Check size={11} strokeWidth={3} aria-hidden="true" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {industry && (
          <span className="org-row-card__industry">{industry}</span>
        )}

        <p className="org-row-card__bio">{description}</p>

        <div className="org-row-card__meta-row">
          <span className="org-row-card__meta-item">
            <CalendarDays size={14} aria-hidden="true" />
            <span>Created {formatCreatedDate(org.createdAt)}</span>
          </span>
          <span className="org-row-card__meta-item">
            <Ticket size={14} aria-hidden="true" />
            <span>
              {eventsCount} {eventsCount === 1 ? "Event" : "Events"}
            </span>
          </span>
        </div>
      </div>

      {/* RIGHT: View organization button */}
      <div className="org-row-card__action">
        <Link
          className="org-row-card__btn"
          to={organizationPath}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <span>View organization</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function OrgListSkeleton() {
  return (
    <div className="org-row-list org-row-list--skeleton" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="org-row-card org-row-card--skeleton" key={index}>
          <span className="org-skeleton org-skeleton--logo" />
          <div className="org-row-card__content">
            <span className="org-skeleton org-skeleton--title" />
            <span className="org-skeleton org-skeleton--industry" />
            <span className="org-skeleton org-skeleton--text" />
            <div className="org-row-card__meta-row">
              <span className="org-skeleton org-skeleton--meta" />
              <span className="org-skeleton org-skeleton--meta" />
            </div>
          </div>
          <div className="org-row-card__action">
            <span className="org-skeleton org-skeleton--btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrgListGrid({
  items,
  loading = false,
  total,
}: OrgListGridProps) {
  const count = total ?? items.length;

  return (
    <section className="org-list" aria-labelledby="org-list-heading">
      {/* 1. SECTION HEADER: Left Title, Right Count */}
      <div className="org-list__header">
        <h2 className="org-list__title" id="org-list-heading">
          Organizations on Eventix
        </h2>
        <span className="org-list__count">
          Showing {count} {count === 1 ? "organization" : "organizations"}
        </span>
      </div>

      {/* 2. ROW LIST */}
      {loading && <OrgListSkeleton />}

      {!loading && items.length === 0 && (
        <div className="org-list__empty">
          <SearchX size={36} aria-hidden="true" />
          <h3>No organizations found</h3>
          <p>Try adjusting your search query.</p>
          <Link className="org-list__emptyBtn" to="/register-organization">
            <span>Register an organization</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="org-row-list">
          {items.map((org, index) => (
            <OrganizationRowCard
              org={org as OrganizationCard}
              key={org.id || org.slug || index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
