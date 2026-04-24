import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicCatalogView } from "@/components/public/public-catalog-view";
import { PublicMenuView } from "@/components/public/public-menu-view";
import { CatalogNotPublished } from "@/components/public/catalog-not-published";
import type { PublicCatalogFetchResult } from "@/lib/public-catalog-fetch";

/** Ramas compartidas para /c/[slug]: redirige menús a /m/, muestra 403 UI o notFound. */
export function renderCatalogoPublicRoute(
    result: PublicCatalogFetchResult,
    slugNorm: string,
): ReactNode {
    switch (result.status) {
        case "ok": {
            if (result.data.public_view === "menu") {
                permanentRedirect(`/m/${slugNorm}`);
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

/** Ramas compartidas para /m/[slug]: redirige catálogos a /c/, muestra 403 UI o notFound. */
export function renderMenuPublicRoute(
    result: PublicCatalogFetchResult,
    slugNorm: string,
): ReactNode {
    switch (result.status) {
        case "ok": {
            if (result.data.public_view !== "menu") {
                permanentRedirect(`/c/${slugNorm}`);
            }
            return <PublicMenuView catalog={result.data} />;
        }
        case "forbidden":
            return <CatalogNotPublished kind="menu" />;
        case "not_found":
        case "invalid_body":
        case "error":
            notFound();
    }
}
