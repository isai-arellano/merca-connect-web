import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicCatalogView } from "@/components/public/public-catalog-view";
import { CatalogNotPublished } from "@/components/public/catalog-not-published";
import type { PublicCatalogFetchResult } from "@/lib/public-catalog-fetch";

/** Ramas compartidas entre /catalogo y /menu (redirect, 403 UI, notFound). */
export function renderCatalogoPublicRoute(
    result: PublicCatalogFetchResult,
    slugNorm: string,
): ReactNode {
    switch (result.status) {
        case "ok": {
            if (result.data.public_view === "menu") {
                permanentRedirect(`/menu/${slugNorm}`);
            }
            return <PublicCatalogView catalog={result.data} />;
        }
        case "forbidden":
            return <CatalogNotPublished kind="catalogo" />;
        case "not_found":
        case "invalid_body":
        case "error":
            notFound();
    }
}

export function renderMenuPublicRoute(
    result: PublicCatalogFetchResult,
    slugNorm: string,
): ReactNode {
    switch (result.status) {
        case "ok": {
            if (result.data.public_view !== "menu") {
                permanentRedirect(`/catalogo/${slugNorm}`);
            }
            return <PublicCatalogView catalog={result.data} />;
        }
        case "forbidden":
            return <CatalogNotPublished kind="menu" />;
        case "not_found":
        case "invalid_body":
        case "error":
            notFound();
    }
}
