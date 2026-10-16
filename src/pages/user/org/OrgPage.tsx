import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ExternalLink,
  Globe2,
  Heart,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sprout,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import OrgHero from "../../../components/user/org/OrgHero";
import OrgListGrid from "../../../components/user/org/OrgListGrid";
import { usePublicOrg } from "../../../hooks/admin/org/useOrg";
import { usePublicOrgBySlug } from "../../../hooks/admin/org/useOrgBySlug";
import { useEvents } from "../../../hooks/user/event/useEvents";
import { useDebounce } from "../../../hooks/useDebounce";
import type { EventDto } from "../../../types/event/event";
import type { Organization } from "../../../types/organization/organization";
import { encodeId } from "../../../utils/hash";

import "../../../styles/user/org/org.css";

type OrganizationDetail = Partial<Organization> & {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt?: string | Date;
  isVerified?: boolean;
  stats?: {
    totalEvents?: number;
    totalMembers?: number;
    [key: string]: any;
  } | null;
  coverUrl?: string | null;
  events?: EventDto[];
  phone?: string | null;
  description?: string | null;
  totalMembers?: number;
  totalEvents?: number;
};

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .toLowerCase();
}

function toSlug(value?: string | null) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Coming soon";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Coming soon";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getOrgInitial(org?: Pick<Organization, "name"> | null) {
  return (org?.name || "E").slice(0, 1).toUpperCase();
}

function isOrgVerified(org?: Partial<Organization> | null) {
  const candidate = org as
    | (Partial<Organization> & {
        verified?: boolean;
        verifiedBadge?: boolean;
        verified_badge?: boolean;
      })
    | undefined;

  return Boolean(
    candidate?.isVerified ||
      candidate?.isve ||
      candidate?.verified ||
      candidate?.verifiedBadge ||
      candidate?.verified_badge,
  );
}

function pickImage(...values: Array<string | null | undefined>) {
  return values.find((value) => Boolean(value && value.trim())) || "";
}

function getEventImage(event: EventDto) {
  return pickImage(event.eventBanner, event.eventPoster) || "/default-banner.png";
}

function getEventCountLabel(event: EventDto) {
  if (typeof event.capacity === "number" && typeof event.soldTickets === "number") {
    const remaining = Math.max(event.capacity - event.soldTickets, 0);
    return `${remaining} seats left`;
  }

  if (typeof event.soldTickets === "number") {
    return `${event.soldTickets} tickets sold`;
  }

  return String(event.status || "Published");
}

function getOrgEventMatches(org: OrganizationDetail, events: EventDto[]) {
  const orgName = normalizeText(org.name);

  const detailEvents = Array.isArray(org.events) ? org.events : [];
  const mergedEvents = [...detailEvents, ...events];
  const uniqueEvents = new Map<string, EventDto>();

  mergedEvents.forEach((event) => {
    const eventOrg = event.organization;
    const matchesId = Boolean(org.id && eventOrg?.id === org.id);
    const matchesName = Boolean(orgName && normalizeText(eventOrg?.name) === orgName);

    if (matchesId || matchesName || detailEvents.includes(event)) {
      uniqueEvents.set(event.id, event);
    }
  });

  return Array.from(uniqueEvents.values()).slice(0, 6);
}

function OrganizationLogo({ org }: { org: OrganizationDetail }) {
  const [imgError, setImgError] = useState(false);
  const logo = org.logo || org.logoUrl;
  if (logo && !imgError) {
    return (
      <img
        className="organizer-detail__logo"
        src={logo}
        alt={`${org.name} logo`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className="organizer-detail__logo organizer-detail__logo--fallback">
      {getOrgInitial(org)}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="org-page organizer-detail organizer-detail--loading" aria-hidden="true">
      <div className="organizer-detail__hero organizer-detail__heroSkeleton" />
      <div className="organizer-detail__main">
        <div className="organizer-detail__skeletonGrid">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function OrganizationDetailView({
  fallbackOrg,
  similarOrganizations,
  slug,
}: {
  fallbackOrg?: Organization;
  similarOrganizations: Organization[];
  slug: string;
}) {
  const { data: orgDetail, loading: orgLoading } = usePublicOrgBySlug(slug);
  const { events, loading: eventsLoading } = useEvents({ page: 1, limit: 60 });
  const org = (orgDetail || fallbackOrg) as OrganizationDetail | undefined;
  const orgEvents = useMemo(() => {
    if (!org) return [];
    return getOrgEventMatches(org, events);
  }, [events, org]);

  const displayWebsite = useMemo(() => {
    if (!org?.website) return "";
    try {
      const url = org.website.startsWith("http") ? org.website : `https://${org.website}`;
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return org.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    }
  }, [org?.website]);

  const joinedYear = useMemo(() => {
    if (!org?.createdAt) return "2021";
    const date = new Date(org.createdAt);
    return Number.isNaN(date.getFullYear()) ? "2021" : String(date.getFullYear());
  }, [org?.createdAt]);

  if (orgLoading && !fallbackOrg) {
    return <DetailSkeleton />;
  }

  if (!org) {
    return (
      <div className="org-page organizer-detail">
        <section className="organizer-detail__empty organizer-detail__empty--page">
          <Building2 size={34} aria-hidden="true" />
          <h1>Organization not found</h1>
          <p>This organization may be unavailable or the public profile is not ready.</p>
          <Link to="/app/organizations">
            Back to organizations
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  }

  const verified = isOrgVerified(org);
  const coverImage = org.bannerUrl || org.coverUrl || "/org-banner-default.png";
  const description =
    org.bio || org.description || "People, events and action for a cleaner, greener, more sustainable tomorrow.";
  const totalEvents = org.stats?.totalEvents ?? org.totalEvents;
  const totalMembers = org.stats?.totalMembers ?? org.totalMembers;

  return (
    <div className="org-page organizer-detail">
      <section className="organizer-detail__hero" aria-label="Organization cover and overview">
        <div className="organizer-detail__cover">
          <div className="organizer-detail__coverFallback">
            <OrganizationLogo org={org} />
          </div>
          <img
            src={coverImage}
            alt={`${org.name} cover`}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.includes("/org-banner-default.png")) {
                target.style.opacity = "0";
              } else {
                target.src = "/org-banner-default.png";
              }
            }}
          />
          <div className="organizer-detail__coverOverlay" />
        </div>

        <div className="organizer-detail__heroContainer">
          <div className="organizer-detail__heroTop">
            <Link to="/app/organizations" className="organizer-detail__backLink">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to organizations</span>
            </Link>
          </div>

          <div className="organizer-detail__heroBottom">
            {verified && (
              <div className="organizer-detail__verifiedBadge">
                <Check size={14} strokeWidth={2.8} aria-hidden="true" />
                <span>Verified organization</span>
              </div>
            )}

            <h1 className="organizer-detail__heroTitle">{org.name}</h1>

            <p className="organizer-detail__heroDesc">{description}</p>

            <div className="organizer-detail__heroMeta">
              {org.industry && (
                <span>
                  <Sprout size={15} aria-hidden="true" />
                  {org.industry}
                </span>
              )}
              {org.address && (
                <span>
                  <MapPin size={15} aria-hidden="true" />
                  {org.address}
                </span>
              )}
              {totalEvents !== undefined && totalEvents !== null && (
                <span>
                  <CalendarDays size={15} aria-hidden="true" />
                  {totalEvents} {totalEvents === 1 ? "event" : "events"}
                </span>
              )}
              {totalMembers !== undefined && totalMembers !== null && (
                <span>
                  <Users size={15} aria-hidden="true" />
                  {Number(totalMembers).toLocaleString()} {totalMembers === 1 ? "member" : "members"}
                </span>
              )}
              <span>
                <CalendarDays size={15} aria-hidden="true" />
                Joined {joinedYear}
              </span>
            </div>

            {org.website && (
              <div className="organizer-detail__heroActions">
                <a
                  href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="organizer-detail__btn-secondary"
                >
                  <span>Visit website</span>
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="organizer-detail__main">
        <div className="organizer-detail__layoutGrid">
          {/* CỘT TRÁI (LEFT 70%) */}
          <div className="organizer-detail__leftCol">

            {/* 3. Organization Overview */}
            <section className="organizer-card organizer-detail__overviewSection">
              <h2 className="organizer-card__title">Organization Overview</h2>
              <div className="organizer-overview__grid">
                {/* Card 1: Organization Founded */}
                <div className="organizer-overview__card">
                  <div className="organizer-overview__icon organizer-overview__icon--purple">
                    <CalendarDays size={20} aria-hidden="true" />
                  </div>
                  <span className="organizer-overview__label">Organization Founded</span>
                  <strong className="organizer-overview__value">
                    {formatDate(org.createdAt)}
                  </strong>
                  <p className="organizer-overview__desc">
                    Joined Eventix community on this date.
                  </p>
                </div>

                {/* Card 2: Verification Status */}
                <div className="organizer-overview__card">
                  <div
                    className={`organizer-overview__icon ${
                      verified ? "organizer-overview__icon--green" : "organizer-overview__icon--amber"
                    }`}
                  >
                    <Check size={20} strokeWidth={2.8} aria-hidden="true" />
                  </div>
                  <span className="organizer-overview__label">Verification Status</span>
                  <strong className="organizer-overview__value">
                    {verified ? "Verified Organization" : "Not Verified"}
                  </strong>
                  <p className="organizer-overview__desc">
                    {verified ? "Official verified organization." : "Standard organization profile."}
                  </p>
                </div>

                {/* Card 3: Events Hosted */}
                <div className="organizer-overview__card">
                  <div className="organizer-overview__icon organizer-overview__icon--blue">
                    <CalendarDays size={20} aria-hidden="true" />
                  </div>
                  <span className="organizer-overview__label">Events Hosted</span>
                  <strong className="organizer-overview__value">
                    {org.stats?.totalEvents ?? org.totalEvents ?? 0}
                  </strong>
                  <p className="organizer-overview__desc">
                    Total events created by organization
                  </p>
                </div>

                {/* Card 4: Community Members */}
                <div className="organizer-overview__card">
                  <div className="organizer-overview__icon organizer-overview__icon--mint">
                    <Users size={20} aria-hidden="true" />
                  </div>
                  <span className="organizer-overview__label">Community Members</span>
                  <strong className="organizer-overview__value">
                    {(org.stats?.totalMembers ?? org.totalMembers ?? 0).toLocaleString()}
                  </strong>
                  <p className="organizer-overview__desc">
                    Current organization members
                  </p>
                </div>
              </div>
            </section>

            {/* 4. SECTION 3: UPCOMING EVENTS */}
            <section className="organizer-card organizer-detail__eventsCard">
              <div className="organizer-card__headerRow">
                <h2 className="organizer-card__title">Upcoming events</h2>
                <Link to="/app/events" className="organizer-card__viewAll">
                  <span>View all events</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              {eventsLoading && (
                <div className="organizer-events__skeletonGrid">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {!eventsLoading && orgEvents.length > 0 && (
                <div className="organizer-events__grid">
                  {orgEvents.slice(0, 3).map((event) => (
                    <article className="organizer-event-card" key={event.id}>
                      <div className="organizer-event-card__thumb">
                        <img src={getEventImage(event)} alt={event.title} />
                      </div>
                      <div className="organizer-event-card__body">
                        <div className="organizer-event-card__top">
                          <span className="organizer-event-card__date">
                            {formatDate(event.startDateTime)}
                          </span>
                          <button
                            type="button"
                            className="organizer-event-card__fav"
                            aria-label="Save event"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.info("Saved to favorites!");
                            }}
                          >
                            <Heart size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <h3 className="organizer-event-card__title">
                          <Link to={`/app/events/${encodeId(event.id)}`}>{event.title}</Link>
                        </h3>
                        <p className="organizer-event-card__meta">
                          <MapPin size={13} aria-hidden="true" />
                          <span>{event.place || "Hà Nội, Việt Nam"}</span>
                        </p>
                        <p className="organizer-event-card__interested">
                          <Users size={13} aria-hidden="true" />
                          <span>{getEventCountLabel(event)}</span>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!eventsLoading && orgEvents.length === 0 && (
                <div className="organizer-detail__emptyState">
                  <CalendarDays size={32} aria-hidden="true" />
                  <h3>No upcoming events yet</h3>
                  <p>This organization has not published events for the upcoming schedule.</p>
                  <Link to="/app/events" className="organizer-card__viewAll">
                    Explore all events <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* CỘT PHẢI (RIGHT 30%) */}
          <aside className="organizer-detail__rightCol">

            {/* 2. Contact Information */}
            <section className="organizer-card organizer-detail__contactCard">
              <div className="organizer-card__titleWithIcon">
                <Link2 size={18} className="organizer-card__icon--purple" aria-hidden="true" />
                <h2 className="organizer-card__title">Contact & links</h2>
              </div>

              <div className="organizer-contact__list">
                {org.email && (
                  <div className="organizer-contact__item">
                    <Mail size={16} aria-hidden="true" />
                    <a href={`mailto:${org.email}`}>
                      {org.email}
                    </a>
                  </div>
                )}

                {org.phone && (
                  <div className="organizer-contact__item">
                    <Phone size={16} aria-hidden="true" />
                    <span>{org.phone}</span>
                  </div>
                )}

                {org.website && (
                  <div className="organizer-contact__item">
                    <Globe2 size={16} aria-hidden="true" />
                    <a
                      href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>https://{displayWebsite || org.website}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </div>
                )}

                {org.address && (
                  <div className="organizer-contact__item">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{org.address}</span>
                  </div>
                )}
              </div>
            </section>

          </aside>
        </div>

        {/* Similar Organizations (nếu có) */}
        {similarOrganizations.length > 0 && (
          <section className="organizer-card organizer-detail__similarSection">
            <div className="organizer-card__headerRow">
              <h2 className="organizer-card__title">Similar organizations</h2>
            </div>
            <div className="organizer-detail__similar">
              {similarOrganizations.map((item) => (
                <Link
                  className="organizer-detail__similarCard"
                  to={`/app/organizations/${item.slug || toSlug(item.name)}`}
                  key={item.id}
                >
                  <span>{getOrgInitial(item)}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.status || "Public"} organizer</small>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="organizer-detail__mobileCta">
        <Link to="/app/events">Explore events</Link>
      </div>
    </div>
  );
}

export default function OrgPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { slug } = useParams();
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const orgQuery = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search: debouncedSearchQuery || undefined,
    }),
    [debouncedSearchQuery],
  );
  const { data, loading } = usePublicOrg(orgQuery);

  const DEFAULT_REFERENCE_ORGS: Organization[] = useMemo(
    () => [
      {
        id: "org-green-future",
        name: "Green Future Community",
        slug: "green-future-community",
        bio: "A global community for, climate action and a cleaner, greener future.",
        status: "ACTIVE" as any,
        isVerified: true,
        owner: { id: "u-mai", fullName: "Mai Nguyen", email: "mai.nguyen@eventix.app" },
        totalMembers: 1240,
        totalEvents: 18,
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "org-saigon-student",
        name: "Saigon Student Community",
        slug: "saigon-student-community",
        bio: "Connecting students in Ho Chi Minh City through events, learning and opportunities.",
        status: "ACTIVE" as any,
        isVerified: true,
        owner: { id: "u-duc", fullName: "Tran Minh Duc", email: "duc.tran@eventix.app" },
        totalMembers: 3400,
        totalEvents: 24,
        createdAt: new Date("2023-03-10"),
      },
      {
        id: "org-techvision-global",
        name: "TechVision Global",
        slug: "techvision-global",
        bio: "A global tech community hosting conferences, meetups and hackathons.",
        status: "ACTIVE" as any,
        isVerified: true,
        owner: { id: "u-daniel", fullName: "Daniel Kim", email: "daniel.kim@techvision.io" },
        totalMembers: 5800,
        totalEvents: 36,
        createdAt: new Date("2022-11-20"),
      },
      {
        id: "org-future-skills",
        name: "Future Skills Hub",
        slug: "future-skills-hub",
        bio: "Empowering the next generation with in-demand skills through events and workshops.",
        status: "PENDING" as any,
        isVerified: false,
        owner: { id: "u-anh", fullName: "Le Thi Anh", email: "anh.le@futureskills.vn" },
        totalMembers: 890,
        totalEvents: 8,
        createdAt: new Date("2023-07-05"),
      },
    ],
    [],
  );

  const organizations = useMemo<Organization[]>(() => {
    if (data?.items && data.items.length > 0) {
      return data.items;
    }
    return DEFAULT_REFERENCE_ORGS;
  }, [data, DEFAULT_REFERENCE_ORGS]);

  const visibleOrganizations = useMemo(() => {
    const query = normalizeText(searchQuery);

    return organizations.filter((org) => {
      const matchesSearch =
        !query ||
        [
          org.name,
          org.description,
          org.bio,
          org.slug,
          org.owner?.fullName,
          org.owner?.email,
        ]
          .map(normalizeText)
          .join(" ")
          .includes(query);

      return matchesSearch;
    });
  }, [organizations, searchQuery]);

  const activeOrgs = organizations.filter((org) => org.status === "ACTIVE").length;
  const selectedOrganization = useMemo(
    () => organizations.find((org) => (org.slug || toSlug(org.name)) === slug),
    [organizations, slug],
  );

  const similarOrganizations = useMemo(
    () =>
      organizations
        .filter((org) => (org.slug || toSlug(org.name)) !== slug)
        .slice(0, 3),
    [organizations, slug],
  );

  if (slug) {
    return (
      <OrganizationDetailView
        fallbackOrg={selectedOrganization}
        similarOrganizations={similarOrganizations}
        slug={slug}
      />
    );
  }

  return (
    <div className="org-page">
      <OrgHero
        activeOrgs={activeOrgs}
        searchValue={searchQuery}
        totalOrgs={data?.total ?? organizations.length}
        onSearchChange={setSearchQuery}
      />
      <OrgListGrid
        items={visibleOrganizations}
        loading={loading}
        total={data?.total ?? organizations.length}
      />
    </div>
  );
}
