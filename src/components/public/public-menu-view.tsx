import { PremiumMenuView } from "@/components/public/premium-menu/premium-menu-view";
import type { PublicCatalogData } from "@/components/public/public-catalog-view";

interface PublicMenuViewProps {
    catalog: PublicCatalogData;
}

export function PublicMenuView({ catalog }: PublicMenuViewProps) {
    return <PremiumMenuView catalog={catalog} />;
}
