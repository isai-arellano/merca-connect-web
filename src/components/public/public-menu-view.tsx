// TODO: Este componente tendrá su propio diseño de menú en el futuro
// (layout horizontal, fotos grandes, secciones sticky, etc.).
// Por ahora es un wrapper sobre PublicCatalogView que reutiliza la presentación de catálogo.
import { PublicCatalogView } from "@/components/public/public-catalog-view";
import type { PublicCatalogData } from "@/components/public/public-catalog-view";

interface PublicMenuViewProps {
    catalog: PublicCatalogData;
}

export function PublicMenuView({ catalog }: PublicMenuViewProps) {
    return <PublicCatalogView catalog={catalog} />;
}
