import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicCatalogResult } from "@/lib/public-catalog-fetch";
import { renderMenuPublicRoute } from "@/lib/public-catalog-route";
import { normalizePublicCatalogSlug } from "@/lib/public-catalog-slug";

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

async function MenuSlugContent({
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
  return renderMenuPublicRoute(result, slugNorm);
}

/** Ver comentario en /catalogo/[slug]/page.tsx (Performance.measure + RSC). */
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <MenuSlugContent params={props.params} />;
}
