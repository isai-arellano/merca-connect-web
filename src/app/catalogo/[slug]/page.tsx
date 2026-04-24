import { permanentRedirect } from "next/navigation";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";

/** Redirige permanentemente /catalogo/{slug} → /c/{slug} */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: raw } = await params;
    const slug = normalizePublicCatalogSlug(raw) ?? raw;
    permanentRedirect(`/c/${slug}`);
}
