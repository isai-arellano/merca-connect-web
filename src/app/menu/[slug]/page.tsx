import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { PublicCatalogView } from "@/components/public/public-catalog-view";
import { fetchPublicCatalog } from "@/lib/public-catalog-fetch";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: raw } = await params;
  if (!normalizePublicCatalogSlug(raw)) {
    return { title: "Menú no encontrado" };
  }
  const catalog = await fetchPublicCatalog(raw);
  if (!catalog) return { title: "Menú no encontrado" };
  return {
    title: `${catalog.business_name} — Menú`,
    description: `Explora el menú de ${catalog.business_name}.`,
  };
}

export default async function MenuPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: raw } = await params;
  const slugNorm = normalizePublicCatalogSlug(raw);
  if (!slugNorm) {
    notFound();
  }
  const catalog = await fetchPublicCatalog(raw);
  if (!catalog) notFound();
  if (catalog.public_view !== "menu") permanentRedirect(`/catalogo/${slugNorm}`);

  return <PublicCatalogView catalog={catalog} />;
}
