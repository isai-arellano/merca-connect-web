import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicCatalogResult } from "@/lib/public-catalog-fetch";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";
import { PublicCatalogView } from "@/components/public/public-catalog-view";
import { CatalogNotPublished } from "@/components/public/catalog-not-published";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
    const { slug: raw } = await params;
    if (!normalizePublicCatalogSlug(raw)) {
        return { title: "Catálogo no encontrado" };
    }
    const result = await fetchPublicCatalogResult(raw);
    if (result.status === "ok") {
        const label = result.data.public_view === "menu" ? "Menú" : "Catálogo";
        return {
            title: `${result.data.business_name} — ${label}`,
            description: `Explora ${result.data.public_view === "menu" ? "el menú" : "los productos"} de ${result.data.business_name}.`,
        };
    }
    if (result.status === "forbidden") {
        return { title: "Catálogo no publicado" };
    }
    return { title: "Catálogo no encontrado" };
}

async function CSlugContent({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: raw } = await params;
    const slugNorm = normalizePublicCatalogSlug(raw);
    if (!slugNorm) notFound();

    const result = await fetchPublicCatalogResult(raw);

    switch (result.status) {
        case "ok":
            return <PublicCatalogView catalog={result.data} />;
        case "forbidden":
            return <CatalogNotPublished kind={result.data?.public_view === "menu" ? "menu" : "catalogo"} />;
        case "not_found":
        case "invalid_body":
        case "error":
            notFound();
    }
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
    return <CSlugContent params={props.params} />;
}
