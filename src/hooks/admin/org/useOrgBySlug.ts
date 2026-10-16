import { useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";

type AnyRecord = Record<string, any>;

const firstDefined = (...values: unknown[]) =>
  values.find((value) => value !== undefined && value !== null);

const readNumber = (...values: unknown[]) => {
  const value = firstDefined(...values);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const readBoolean = (...values: unknown[]) => {
  const value = firstDefined(...values);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const normalizeOrgDetail = (response: unknown) => {
  const root = (response && typeof response === "object" ? response : {}) as AnyRecord;
  const data = root.data && typeof root.data === "object" ? root.data as AnyRecord : root;
  const organization =
    data.organization ||
    data.org ||
    data.item ||
    data.detail ||
    root.organization ||
    root.org ||
    data;
  const org = (organization && typeof organization === "object"
    ? organization
    : data) as AnyRecord;
  const rawStats = (org.stats || data.stats || root.stats || data.summary || data.meta || root.summary || {}) as AnyRecord;
  const summary = (data.summary || rawStats || data.meta || root.summary || {}) as AnyRecord;
  const counts = (org._count || data._count || summary._count || {}) as AnyRecord;
  const members = org.members || data.members || org.memberships || data.memberships;
  const events = org.events || data.events;
  const totalMembers = readNumber(
    rawStats.totalMembers,
    rawStats.memberCount,
    rawStats.membersCount,
    rawStats.members,
    rawStats.followers,
    org.totalMembers,
    data.totalMembers,
    summary.totalMembers,
    org.memberCount,
    data.memberCount,
    summary.memberCount,
    org.membersCount,
    data.membersCount,
    summary.membersCount,
    counts.members,
    counts.memberships,
    Array.isArray(members) ? members.length : undefined,
  );
  const totalEvents = readNumber(
    rawStats.totalEvents,
    rawStats.eventCount,
    rawStats.eventsCount,
    rawStats.events,
    org.totalEvents,
    data.totalEvents,
    summary.totalEvents,
    org.eventCount,
    data.eventCount,
    summary.eventCount,
    org.eventsCount,
    data.eventsCount,
    summary.eventsCount,
    counts.events,
    Array.isArray(events) ? events.length : undefined,
  );
  const isVerified = readBoolean(
      org.isVerified,
      data.isVerified,
      summary.isVerified,
      org.isve,
      data.isve,
      org.verified,
      data.verified,
      org.verifiedBadge,
      data.verifiedBadge,
      org.verified_badge,
      data.verified_badge,
  );

  return {
    ...org,
    id: org.id ?? data.id ?? root.id,
    slug: org.slug ?? data.slug ?? root.slug,
    name: org.name ?? data.name ?? root.name,
    logoUrl: org.logoUrl ?? data.logoUrl ?? org.logo ?? data.logo,
    bannerUrl: org.bannerUrl ?? data.bannerUrl ?? org.coverUrl ?? data.coverUrl,
    bio: org.bio ?? data.bio,
    industry: org.industry ?? data.industry,
    website: org.website ?? data.website,
    email: org.email ?? data.email,
    address: org.address ?? data.address,
    createdAt: org.createdAt ?? data.createdAt,
    status: firstDefined(org.status, data.status, summary.status),
    isVerified,
    stats: {
      ...(typeof rawStats === "object" ? rawStats : {}),
      totalMembers: totalMembers ?? 0,
      totalEvents: totalEvents ?? 0,
    },
    totalMembers: totalMembers ?? 0,
    totalEvents: totalEvents ?? 0,
  };
};

export const useOrgBySlug = (slug: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const fetchOrgBySlug = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orgService.getOrgBySlug(slug);
      setData(normalizeOrgDetail(res));
    } catch (err) {
      setData(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!slug) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchOrgBySlug();
  }, [slug]);
  return { data, loading, error, refetch: fetchOrgBySlug };
};

export const usePublicOrgBySlug = (slug: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const fetchOrgBySlug = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orgService.getPublicOrgBySlug(slug);
      setData(normalizeOrgDetail(res));
    } catch (err) {
      setData(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchOrgBySlug();
  }, [slug]);
  return { data, loading, error, refetch: fetchOrgBySlug };
};
