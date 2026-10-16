import { useCallback, useEffect, useState } from "react";

import { eventService } from "../../../services/admin/event.service";
import type { EventDto } from "../../../types/event/event";
import type { Query } from "../../../types/query";

type EventListResponse = {
  items: EventDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type EventListApiResponse =
  | EventListResponse
  | EventDto[]
  | {
      data?:
        | EventListResponse
        | EventDto[]
        | { data?: EventListResponse }
        | { items?: EventDto[]; meta?: EventListMeta };
      items?: EventDto[];
      meta?: EventListMeta;
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };

type EventListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
};

const emptyEventList: EventListResponse = {
  items: [],
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
};

function normalizeEventListResponse(response: EventListApiResponse): EventListResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      page: 1,
      limit: response.length,
      total: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    };
  }

  const responseObject = response as {
    data?:
      | EventListResponse
      | EventDto[]
      | { data?: EventListResponse }
      | { items?: EventDto[]; meta?: EventListMeta };
    items?: EventDto[];
    meta?: EventListMeta;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  const directData = responseObject.data;
  if (directData) {
    if (Array.isArray(directData)) {
      return normalizeEventListResponse(directData);
    }

    if ("data" in directData && directData.data) {
      return normalizeEventListResponse(directData.data);
    }

    if ("items" in directData && Array.isArray(directData.items)) {
      const paginatedData = directData as EventListResponse & { meta?: EventListMeta };
      const meta = paginatedData.meta;
      return {
        items: paginatedData.items,
        page: Number(meta?.page ?? meta?.currentPage ?? paginatedData.page ?? 1),
        limit: Number(meta?.limit ?? meta?.itemsPerPage ?? paginatedData.limit ?? paginatedData.items.length),
        total: Number(meta?.total ?? meta?.totalItems ?? paginatedData.total ?? paginatedData.items.length),
        totalPages: Number(meta?.totalPages ?? paginatedData.totalPages ?? (paginatedData.items.length > 0 ? 1 : 0)),
      };
    }
  }

  if (Array.isArray(responseObject.items)) {
    const meta = responseObject.meta;
    return {
      items: responseObject.items,
      page: Number(meta?.page ?? meta?.currentPage ?? responseObject.page ?? 1),
      limit: Number(meta?.limit ?? meta?.itemsPerPage ?? responseObject.limit ?? responseObject.items.length),
      total: Number(meta?.total ?? meta?.totalItems ?? responseObject.total ?? responseObject.items.length),
      totalPages: Number(meta?.totalPages ?? responseObject.totalPages ?? (responseObject.items.length > 0 ? 1 : 0)),
    };
  }

  return emptyEventList;
}

export const useEvents = (query?: Query) => {
  const [data, setData] = useState<EventListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await eventService.getPublicEvents(query);
      const normalizedData = normalizeEventListResponse(res);
      console.log("[Public Events] items length:", normalizedData.items.length);
      setData(normalizedData);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    data,
    events: data?.items ?? [],
    loading,
    error,
    refetch: fetchEvents,
  };
};
