import { useCallback, useEffect, useState } from "react";
import { orgService } from "../../../services/admin/organization.service";
import type { Query } from "../../../types/query";
import type { Organization } from "../../../types/organization/organization";

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

export function normalizePublicOrg(item: any): Organization {
  if (!item || typeof item !== "object") return item;

  const logo = item.logo || item.logoUrl || item.avatar || "";
  const description = item.description ?? item.bio ?? "";
  const rawSlug =
    item.slug ||
    item.orgSlug ||
    item.organizationSlug ||
    item.organization?.slug ||
    item.org?.slug ||
    "";
  const slug = (rawSlug && String(rawSlug).trim()) || toSlug(item.name) || String(item.id || "");

  return {
    ...item,
    id: String(item.id || ""),
    name: item.name || "Organization",
    logo,
    logoUrl: logo,
    description,
    bio: description,
    slug,
    status: item.status || "ACTIVE",
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    owner: item.owner || null,
    totalMembers: typeof item.totalMembers === "number" ? item.totalMembers : 0,
  };
}

export function unwrapOrgApiResponse(res: any): { items: Organization[]; total: number } {
  if (!res) return { items: [], total: 0 };

  // 1. Direct array of organizations
  if (Array.isArray(res)) {
    const items = res.map(normalizePublicOrg);
    return { items, total: items.length };
  }

  // 2. res.data is an array
  if (Array.isArray(res.data)) {
    const items = res.data.map(normalizePublicOrg);
    const total = typeof res.total === "number" ? res.total : items.length;
    return { items, total };
  }

  // 3. res.data.items is an array
  if (res.data && Array.isArray(res.data.items)) {
    const items = res.data.items.map(normalizePublicOrg);
    const total =
      typeof res.data.total === "number"
        ? res.data.total
        : typeof res.total === "number"
        ? res.total
        : items.length;
    return { items, total };
  }

  // 4. res.items is an array
  if (Array.isArray(res.items)) {
    const items = res.items.map(normalizePublicOrg);
    const total = typeof res.total === "number" ? res.total : items.length;
    return { items, total };
  }

  // 5. Fallback for nested object with array property
  if (typeof res === "object") {
    for (const key of ["items", "organizations", "orgs", "data"]) {
      if (Array.isArray(res[key])) {
        const items = res[key].map(normalizePublicOrg);
        return { items, total: typeof res.total === "number" ? res.total : items.length };
      }
    }
  }

  return { items: [], total: 0 };
}

export const useOrg = (query?: Query) => {
  const [data, setData] = useState<{ items: Organization[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orgService.getOrgs(query);
      const unwrapped = unwrapOrgApiResponse(res);
      setData(unwrapped);
    } catch (err) {
      console.error("Fetch organizations error:", err);
      setError(err);
      setData({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return { data, loading, error, fetchData: fetchOrgs };
};

export const usePublicOrg = (query?: Query) => {
  const [data, setData] = useState<{ items: Organization[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orgService.getPublicOrganizations(query);
      const unwrapped = unwrapOrgApiResponse(res);
      setData(unwrapped);
    } catch (err) {
      console.error("Fetch public organizations error:", err);
      setError(err);
      setData({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return { data, loading, error, fetchData: fetchOrgs };
};
