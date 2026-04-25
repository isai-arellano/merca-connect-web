import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicCatalogResult } from "@/lib/public-catalog-fetch";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";
import { PublicMenuView } from "@/components/public/public-menu-view";
import { CatalogNotPublished } from "@/components/public/catalog-not-published";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
    const { slug: raw } = await params;
    if (!normalizePublicCatalogSlug(raw)) {
        return { title: "Menú no encontrado" };
    }
    const result = await fetchPublicCatalogResult(raw);
    if (result.status === "ok") {
        return {
            title: `${result.data.business_name} — Menú`,
            description: `Explora el menú de ${result.data.business_name}.`,
        };
    }
    if (result.status === "forbidden") {
        return { title: "Menú no publicado" };
    }
    return { title: "Menú no encontrado" };
}

async function MSlugContent({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: raw } = await params;
    const slugNorm = normalizePublicCatalogSlug(raw);
    if (!slugNorm) notFound();

    const result = await fetchPublicCatalogResult(raw);

    switch (result.status) {
        case "ok":
            return <PublicMenuView catalog={result.data} />;
        case "forbidden":
            return <CatalogNotPublished kind="menu" />;
        case "not_found":
        case "invalid_body":
        case "error":
            notFound();
    }
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
    return <MSlugContent params={props.params} />;
}
