import { PremiumMenuView } from "@/components/public/premium-menu/premium-menu-view";
import type { PublicCatalogData } from "@/components/public/public-catalog-view";
import { resolveThemeTokens } from "@/config/catalog-themes";

interface PublicMenuViewProps {
    catalog: PublicCatalogData;
}

export function PublicMenuView({ catalog }: PublicMenuViewProps) {
    const tokens = resolveThemeTokens(catalog.catalog_theme as any, "menu");
    return <PremiumMenuView catalog={catalog} tokens={tokens} />;
}
