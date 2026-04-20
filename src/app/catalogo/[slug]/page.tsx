import { notFound, permanentRedirect } from "next/navigation";
import { getServerApiBaseUrl } from "@/lib/api";
import type { Metadata } from "next";
import { PublicCatalogView, type PublicCatalogData } from "@/components/public/public-catalog-view";

async function getCatalog(slug: string): Promise<PublicCatalogData | null> {
    try {
        const res = await fetch(
            `${getServerApiBaseUrl()}/api/v1/catalog/${encodeURIComponent(slug)}`,
            { cache: "no-store" },
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const catalog = await getCatalog(slug);
    if (!catalog) return { title: "Catálogo no encontrado" };
    return {
        title: `${catalog.business_name} — Catálogo`,
        description: `Explora los productos de ${catalog.business_name}.`,
    };
}

export default async function CatalogPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const catalog = await getCatalog(slug);

    if (!catalog) notFound();

    if (catalog.public_view === "menu") {
        permanentRedirect(`/menu/${slug}`);
    }

    return <PublicCatalogView catalog={catalog} />;
}
