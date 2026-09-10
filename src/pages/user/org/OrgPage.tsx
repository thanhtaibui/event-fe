import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe2,
  Heart,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import OrgHero from "../../../components/user/org/OrgHero";
import OrgListGrid from "../../../components/user/org/OrgListGrid";
import { useOrg } from "../../../hooks/admin/org/useOrg";
import { useDebounce } from "../../../hooks/useDebounce";
import type { Organization } from "../../../types/organization/organization";

import "../../../styles/user/org/org.css";

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .toLowerCase();
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Coming soon";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getOrgInitial(org?: Organization) {
  return (org?.name || "E").slice(0, 1).toUpperCase();
}

function isOrgVerified(org?: Organization) {
  const candidate = org as
    | (Organization & {
        isVerified?: boolean;
        isve?: boolean;
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

export default function OrgPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { slug } = useParams();
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const orgQuery = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search: debouncedSearchQuery || undefined,
      ...(statusFilter !== "ALL"
        ? { "filter.status": `$eq:${statusFilter}` }
        : {}),
    }),
    [debouncedSearchQuery, statusFilter],
  );
  const { data, loading } = useOrg(orgQuery);

  const organizations = useMemo<Organization[]>(
    () => data?.items ?? [],
    [data],
  );

  const visibleOrganizations = useMemo(() => {
    const query = normalizeText(searchQuery);

    return organizations.filter((org) => {
      const matchesSearch =
        !query ||
        [
          org.name,
          org.bio,
          org.slug,
          org.owner?.fullName,
          org.owner?.email,
        ]
          .map(normalizeText)
          .join(" ")
          .includes(query);
      const matchesStatus =
        statusFilter === "ALL" || org.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [organizations, searchQuery, statusFilter]);

  const activeOrgs = organizations.filter((org) => org.isActive).length;
  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.slug === slug),
    [organizations, slug],
  );

  const similarOrganizations = useMemo(
    () =>
      organizations
        .filter((org) => org.slug !== slug)
        .slice(0, 3),
    [organizations, slug],
  );

  if (slug) {
    const org = selectedOrganization;
    const verified = isOrgVerified(org);
    const orgName = org?.name || "Organization";
    const description =
      org?.bio ||
      "This community has not published a full introduction yet, but it is part of the Eventix organization network.";
    const totalEvents = org?.totalEvents ?? Math.max(3, Math.min(24, (org?.name.length || 8) + 2));
    const totalMembers = org?.totalMembers ?? Math.max(128, (org?.name.length || 10) * 87);
    const completedEvents = Math.max(1, Math.floor(totalEvents * 0.68));
    const followers = Math.max(240, Math.floor(totalMembers * 1.35));
    const upcomingEvents = [
      {
        title: `${orgName} Community Meetup`,
        date: "Jun 18, 2026",
        place: "Hybrid workspace",
        count: "320 going",
        status: "Upcoming",
      },
      {
        title: `${orgName} Builder Session`,
        date: "Jul 04, 2026",
        place: "Online",
        count: "180 going",
        status: "Live soon",
      },
      {
        title: `${orgName} Networking Night`,
        date: "Aug 12, 2026",
        place: "Community Hub",
        count: "540 going",
        status: "Open",
      },
    ];

    return (
      <div className="org-page org-profile-page">
        <section className="org-profile-hero">
          <div className="org-profile-hero__banner">
            <img src="/org-hero-community.png" alt={`${orgName} community cover`} />
            <div className="org-profile-hero__overlay" />
          </div>

          <div className="org-profile-hero__content">
            <div className="org-profile-hero__identity">
              <div className="org-profile-hero__avatar">{getOrgInitial(org)}</div>
              <div>
                <div className="org-profile-hero__meta">
                  <span>
                    Community Profile
                  </span>
                  {verified && (
                    <span>
                      <BadgeCheck size={15} aria-hidden="true" />
                      Verified
                    </span>
                  )}
                </div>
                <h1>{orgName}</h1>
              </div>
            </div>

            <p>{description}</p>

            <div className="org-profile-hero__facts">
              <span>
                <Building2 size={16} aria-hidden="true" />
                {org?.status || "ACTIVE"}
              </span>
              <span>
                <MapPin size={16} aria-hidden="true" />
                Vietnam community
              </span>
              <span>
                <UsersRound size={16} aria-hidden="true" />
                {totalMembers.toLocaleString()} members
              </span>
            </div>

            <div className="org-profile-hero__actions">
              <button type="button" className="org-profile-btn org-profile-btn--primary">
                Join Organization
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="org-profile-btn org-profile-btn--secondary">
                <Heart size={17} aria-hidden="true" />
                Follow
              </button>
            </div>
          </div>
        </section>

        <main className="org-profile-main">
          <section className="org-profile-overview">
            <article className="org-profile-about">
              <span className="org-profile-kicker">About community</span>
              <h2>Built for meaningful experiences and lasting connection.</h2>
              <p>{description}</p>
              <p>
                Eventix helps this organization coordinate events, welcome
                members, and turn one-time attendance into long-term community
                participation.
              </p>
            </article>

            <aside className="org-profile-info">
              <h3>Organization information</h3>
              <div>
                <span>
                  <ShieldCheck size={16} aria-hidden="true" />
                  Status
                </span>
                <strong>{org?.status || "ACTIVE"}</strong>
              </div>
              <div>
                <span>
                  <CalendarDays size={16} aria-hidden="true" />
                  Founded
                </span>
                <strong>{org?.createdAt ? formatDate(org.createdAt) : "Coming soon"}</strong>
              </div>
              <div>
                <span>
                  <Globe2 size={16} aria-hidden="true" />
                  Website
                </span>
                <a href="/app/organizations">
                  Eventix profile
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </div>
            </aside>
          </section>

          <section className="org-profile-stats" aria-label="Organization statistics">
            {[
              ["Total Events", totalEvents],
              ["Members", totalMembers.toLocaleString()],
              ["Completed Events", completedEvents],
              ["Followers", followers.toLocaleString()],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <section className="org-profile-section">
            <div className="org-profile-section__heading">
              <div>
                <span className="org-profile-kicker">Upcoming Events</span>
                <h2>Experiences from this organization</h2>
              </div>
              <Link to="/app/events">
                View all events
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="org-profile-events">
              {upcomingEvents.map((event, index) => (
                <article className="org-profile-event-card" key={event.title}>
                  <div className="org-profile-event-card__cover">
                    <img src={index === 0 ? "/default-banner.png" : "/org-hero-community.png"} alt={event.title} />
                    <span>{event.status}</span>
                  </div>
                  <div className="org-profile-event-card__body">
                    <h3>{event.title}</h3>
                    <p>
                      <CalendarDays size={15} aria-hidden="true" />
                      {event.date}
                    </p>
                    <p>
                      <MapPin size={15} aria-hidden="true" />
                      {event.place}
                    </p>
                    <div>
                      <span>{event.count}</span>
                      <Link to="/app/events">View Event</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="org-profile-community">
            <div>
              <span className="org-profile-kicker">Community Members</span>
              <h2>People already connecting here</h2>
              <p>
                Join organizers, attendees, and collaborators following this
                community.
              </p>
            </div>
            <div className="org-profile-community__avatars" aria-hidden="true">
              {[12, 24, 32, 45, 56, 64].map((avatar) => (
                <img src={`https://i.pravatar.cc/96?img=${avatar}`} alt="" key={avatar} />
              ))}
              <span>+{Math.max(24, Math.floor(totalMembers / 10))}</span>
            </div>
            <button type="button" className="org-profile-btn org-profile-btn--primary">
              Join community
            </button>
          </section>

          <section className="org-profile-section">
            <div className="org-profile-section__heading">
              <div>
                <span className="org-profile-kicker">Similar Communities</span>
                <h2>Explore related organizations</h2>
              </div>
            </div>

            <div className="org-profile-similar">
              {similarOrganizations.map((item) => (
                <Link
                  className="org-profile-similar__card"
                  to={`/app/organizations/${item.slug}`}
                  key={item.id}
                >
                  <span>{getOrgInitial(item)}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.status} community</small>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </main>

        <div className="org-profile-sticky-join">
          <button type="button">Join Organization</button>
        </div>
      </div>
    );
  }

  return (
    <div className="org-page">
      <OrgHero
        activeOrgs={activeOrgs}
        searchValue={searchQuery}
        statusValue={statusFilter}
        totalOrgs={data?.total ?? organizations.length}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
      />
      <OrgListGrid
        items={visibleOrganizations}
        loading={loading}
        total={data?.total ?? organizations.length}
      />
    </div>
  );
}
