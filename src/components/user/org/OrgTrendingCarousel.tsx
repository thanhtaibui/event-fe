import { ArrowRight, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type TrendingOrg = {
  id: string;
  name: string;
  description: string;
  members_count: string;
  events_count: number;
  image_url: string;
  icon_url: string;
  badge_color: string;
  isVerified?: boolean;
  isve?: boolean;
  verified?: boolean;
  verifiedBadge?: boolean;
  verified_badge?: boolean;
  slug?: string;
  orgSlug?: string;
  organizationSlug?: string;
  organization?: {
    slug?: string;
  };
  org?: {
    slug?: string;
  };
};

interface OrgTrendingCarouselProps {
  items: TrendingOrg[];
}

function OrgImageFallback({ name }: { name: string }) {
  return (
    <div className="org-default-cover" aria-label={name}>
      <span>{name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function OrgIconFallback({ name }: { name: string }) {
  return <span className="org-default-icon">{name.slice(0, 1).toUpperCase()}</span>;
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

function TrendingOrgCard({ org }: { org: TrendingOrg }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const directSlug =
    org.slug ||
    org.orgSlug ||
    org.organizationSlug ||
    org.organization?.slug ||
    org.org?.slug;
  const slug = (directSlug && typeof directSlug === "string" && directSlug.trim())
    ? directSlug.trim()
    : toSlug(org.name) || org.id || "";
  const targetRoute = `/app/organizations/${slug}`;
  const verified = Boolean(
    org.isVerified ||
      org.isve ||
      org.verified ||
      org.verifiedBadge ||
      org.verified_badge,
  );

  return (
    <article className="org-trending__card">
      <div
        className="org-trending__card-image"
        style={coverFailed ? undefined : { backgroundImage: `url(${org.image_url})` }}
      >
        {coverFailed && <OrgImageFallback name={org.name} />}
        <div
          className="org-trending__icon-badge"
          style={{ backgroundColor: org.badge_color }}
        >
          {iconFailed ? (
            <OrgIconFallback name={org.name} />
          ) : (
            <img
              src={org.icon_url}
              alt=""
              onError={() => setIconFailed(true)}
            />
          )}
        </div>
        {!coverFailed && (
          <img
            className="org-trending__coverProbe"
            src={org.image_url}
            alt=""
            onError={() => setCoverFailed(true)}
          />
        )}
      </div>
      <div className="org-trending__card-body">
        <div className="org-trending__name-row">
          <h3>{org.name}</h3>
          {verified && (
            <BadgeCheck className="org-trending__verified" size={18} aria-label="Verified" />
          )}
        </div>
        <p>{org.description}</p>
        <div className="org-trending__stats">
          <span>{org.members_count} Members</span>
          <span>{org.events_count} Events</span>
        </div>
        <Link
          className="org-trending__view-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
          to={targetRoute}
        >
          View Organization
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function OrgTrendingCarousel({
  items,
}: OrgTrendingCarouselProps) {
  return (
    <section className="org-trending">
      <div className="org-trending__header">
        <div>
          <h2>Trending Organizations</h2>
          <p className="org-trending__header-meta">
            Top communities shaping the future.
          </p>
        </div>
        <a className="org-trending__view-all" href="#">
          View all
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>

      <div className="org-trending__cards">
        {items.map((org) => (
          <TrendingOrgCard org={org} key={org.id} />
        ))}
      </div>
    </section>
  );
}
