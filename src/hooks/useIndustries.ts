"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { ApiError, apiClient } from "@/lib/api-client";
import {
    FALLBACK_INDUSTRIES,
    buildIndustryMapFromApi,
    type IndustryApiRow,
    type IndustryConfig,
} from "@/config/industries";

/**
 * Prioriza GET /api/v1/catalog/industries; si 404, intenta /api/v1/industries (despliegues antiguos).
 * Si ambos fallan con 404, seed local sin lanzar error.
 */
async function industriesFetcher(url: string): Promise<IndustryApiRow[]> {
    try {
        return await apiClient.get<IndustryApiRow[]>(url);
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
            const legacyUrl = url.replace("/catalog/industries", "/industries");
            if (legacyUrl !== url) {
                try {
                    return await apiClient.get<IndustryApiRow[]>(legacyUrl);
                } catch (e2) {
                    if (e2 instanceof ApiError && e2.status === 404) {
                        return [];
                    }
                    throw e2;
                }
            }
            return [];
        }
        throw e;
    }
}

export function useIndustries(): {
    industriesMap: Record<string, IndustryConfig>;
    orderedRows: IndustryApiRow[] | undefined;
    isLoading: boolean;
    isError: boolean;
    usingFallback: boolean;
} {
    const { data, error, isLoading } = useSWR<IndustryApiRow[]>(endpoints.industries.list, industriesFetcher);

    const industriesMap = useMemo(() => {
        if (error || !data?.length) {
            return FALLBACK_INDUSTRIES;
        }
        return buildIndustryMapFromApi(data);
    }, [data, error]);

    const usingFallback = Boolean(error || !data?.length);

    return {
        industriesMap,
        orderedRows: data,
        isLoading,
        isError: Boolean(error),
        usingFallback,
    };
}
