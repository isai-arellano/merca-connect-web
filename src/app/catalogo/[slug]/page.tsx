import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicCatalogResult } from "@/lib/public-catalog-fetch";
import { renderCatalogoPublicRoute } from "@/lib/public-catalog-route";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
    const { slug: raw } = await params;
    if (!normalizePublicCatalogSlug(raw)) {
        return { title: "Catálogo no encontrado" };
    }
    const result = await fetchPublicCatalogResult(raw);
    if (result.status === "ok") {
        return {
            title: `${result.data.business_name} — Catálogo`,
            description: `Explora los productos de ${result.data.business_name}.`,
        };
    }
    if (result.status === "forbidden") {
        return { title: "Catálogo no publicado" };
    }
    return { title: "Catálogo no encontrado" };
}

async function CatalogoSlugContent({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug: raw } = await params;
    const slugNorm = normalizePublicCatalogSlug(raw);
    if (!slugNorm) {
        notFound();
    }
    const result = await fetchPublicCatalogResult(raw);
    return renderCatalogoPublicRoute(result, slugNorm);
}

/**
 * Export por defecto sync (`Page`) que delega en un RSC async: evita fallos de
 * instrumentación (Performance.measure / marca de tiempo negativa) con async como default en Next 16 / React 19.
 * El fallback visual está en ./loading.tsx.
 */
export default function Page(props: { params: Promise<{ slug: string }> }) {
    return <CatalogoSlugContent params={props.params} />;
}
