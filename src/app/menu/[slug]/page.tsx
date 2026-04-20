import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import { PublicCatalogView, type PublicCatalogData } from "@/components/public/public-catalog-view";

async function getCatalog(slug: string): Promise<PublicCatalogData | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/catalog/${encodeURIComponent(slug)}`,
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
  if (!catalog) return { title: "Menú no encontrado" };
  return {
    title: `${catalog.business_name} — Menú`,
    description: `Explora el menú de ${catalog.business_name}.`,
  };
}

export default async function MenuPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const catalog = await getCatalog(slug);
  if (!catalog) notFound();
  if (catalog.public_view !== "menu") permanentRedirect(`/catalogo/${slug}`);

  return <PublicCatalogView catalog={catalog} />;
}
