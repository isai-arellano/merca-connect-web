import { cache } from "react";
import { getServerApiBaseUrl } from "@/lib/api";
import type { PublicCatalogData } from "@/components/public/public-catalog-view";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";

function isPublicCatalogData(value: unknown): value is PublicCatalogData {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const o = value as Record<string, unknown>;
    return typeof o.business_name === "string" && Array.isArray(o.sections);
}

export type PublicCatalogFetchResult =
    | { status: "ok"; data: PublicCatalogData }
    | { status: "forbidden" }
    | { status: "not_found" }
    | { status: "invalid_body" }
    | { status: "error" };

/**
 * Fetch público del API (servidor). Uno por request vía React.cache (metadata + página).
 * 403 = negocio existe pero `catalog_public` no activo; 404 = slug inexistente o negocio inactivo.
 */
export const fetchPublicCatalogResult = cache(
    async (rawSlug: string): Promise<PublicCatalogFetchResult> => {
        const slug = normalizePublicCatalogSlug(rawSlug);
        if (!slug) {
            return { status: "not_found" };
        }
        try {
            const res = await fetch(
                `${getServerApiBaseUrl()}/api/v1/catalog/${encodeURIComponent(slug)}`,
                { cache: "no-store" },
            );
            if (res.status === 403) {
                return { status: "forbidden" };
            }
            if (res.status === 404) {
                return { status: "not_found" };
            }
            if (!res.ok) {
                return { status: "error" };
            }
            const data: unknown = await res.json();
            if (!isPublicCatalogData(data)) {
                return { status: "invalid_body" };
            }
            return { status: "ok", data };
        } catch {
            return { status: "error" };
        }
    },
);
