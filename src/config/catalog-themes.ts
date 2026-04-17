export type CatalogThemePreset = "default";
export type PublicView = "catalogo" | "menu";

/** MercaConnect palette: #EEFAEE mint, #74E79C spring, #1A3E35 forest */
export interface CatalogThemeTokens {
  pageBackground: string;
  cardBackground: string;
  border: string;
  title: string;
  subtitle: string;
  accent: string;
  badge: string;
}

export interface CatalogThemeDefinition {
  label: string;
  description: string;
  tokens: Record<PublicView, CatalogThemeTokens>;
}

/** Único tema: contraste oscuro (antes «Marca contraste»). */
export const CATALOG_THEME_PRESETS: Record<CatalogThemePreset, CatalogThemeDefinition> = {
  default: {
    label: "Default",
    description: "Superficie oscura forest, texto claro y acentos spring.",
    tokens: {
      catalogo: {
        pageBackground: "bg-[#1A3E35]",
        cardBackground: "bg-[#234A40]",
        border: "border-[#74E79C]/25",
        title: "text-[#EEFAEE]",
        subtitle: "text-[#EEFAEE]/75",
        accent: "text-[#74E79C]",
        badge: "bg-[#74E79C]/20 text-[#EEFAEE] border border-[#74E79C]/35",
      },
      menu: {
        pageBackground: "bg-[#152E28]",
        cardBackground: "bg-[#1F3D35]",
        border: "border-[#74E79C]/30",
        title: "text-[#EEFAEE]",
        subtitle: "text-[#EEFAEE]/75",
        accent: "text-[#74E79C]",
        badge: "bg-[#74E79C]/25 text-[#EEFAEE]",
      },
    },
  },
};

const LEGACY_PRESETS = new Set(["brand_classic", "brand_modern", "brand_contrast"]);

/**
 * Valor que enviamos en PATCH `config.catalog_theme.preset`.
 * Equivale visualmente al tema «Default» y es aceptado por validadores que aún no incluyen `default`.
 */
export const CATALOG_THEME_PRESET_API_WIRE = "brand_contrast" as const;

export function resolveCatalogThemePreset(value: string | undefined | null): CatalogThemePreset {
  if (value === "default" || LEGACY_PRESETS.has(value ?? "")) {
    return "default";
  }
  return "default";
}

export function getDefaultCatalogThemePreset(_view: PublicView): CatalogThemePreset {
  return "default";
}
