import { useCallback, useEffect, useMemo, useState } from "react";
import { orgVerificationService } from "../../../services/admin/org-verification.service";
import type { Query } from "../../../types/query";
import type { OrgVerificationRequest } from "../../../types/organization/verification";

type VerificationListData = {
  items: OrgVerificationRequest[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

function unwrapVerificationList(value: any): VerificationListData {
  const payload = value?.data ?? value;

  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: payload.length,
      totalPages: 1,
    };
  }

  return {
    items: payload?.items ?? [],
    total: payload?.total ?? payload?.items?.length ?? 0,
    page: payload?.page,
    limit: payload?.limit,
    totalPages: payload?.totalPages,
  };
}

export function useOrgVerification(query?: Query) {
  const [data, setData] = useState<VerificationListData>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const queryKey = useMemo(() => JSON.stringify(query || {}), [query]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orgVerificationService.getAll(query);
      setData(unwrapVerificationList(res));
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, fetchData };
}

export function useSubmitOrgVerification() {
  const [loading, setLoading] = useState(false);

  const submitVerification = async (
    organizationId: string,
    taxIdNumber: string,
    documentUrl: string,
  ) => {
    try {
      setLoading(true);
      await orgVerificationService.create({
        organizationId,
        taxIdNumber,
        documentUrl,
      });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitVerification, loading };
}

