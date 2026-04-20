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

/**
 * Un fetch por request para metadata + page (deduplicación con React.cache).
 */
export const fetchPublicCatalog = cache(async (rawSlug: string): Promise<PublicCatalogData | null> => {
    const slug = normalizePublicCatalogSlug(rawSlug);
    if (!slug) {
        return null;
    }
    try {
        const res = await fetch(
            `${getServerApiBaseUrl()}/api/v1/catalog/${encodeURIComponent(slug)}`,
            { cache: "no-store" },
        );
        if (!res.ok) {
            return null;
        }
        const data: unknown = await res.json();
        return isPublicCatalogData(data) ? data : null;
    } catch {
        return null;
    }
});
