export type CatalogThemePreset = "brand_classic" | "brand_modern" | "brand_contrast";
export type PublicView = "catalogo" | "menu";

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

export const CATALOG_THEME_PRESETS: Record<CatalogThemePreset, CatalogThemeDefinition> = {
  brand_classic: {
    label: "Marca Clásico",
    description: "Diseño limpio y corporativo con énfasis en lectura.",
    tokens: {
      catalogo: {
        pageBackground: "bg-[#F8FAF9]",
        cardBackground: "bg-white",
        border: "border-[#D7E1DE]",
        title: "text-[#163630]",
        subtitle: "text-[#4A5C58]",
        accent: "text-[#1A3E35]",
        badge: "bg-[#E8F2EF] text-[#1A3E35]",
      },
      menu: {
        pageBackground: "bg-[#F7F5F2]",
        cardBackground: "bg-white",
        border: "border-[#E4DED7]",
        title: "text-[#2B211A]",
        subtitle: "text-[#6B5F55]",
        accent: "text-[#1A3E35]",
        badge: "bg-[#EFE7DD] text-[#5E4A3B]",
      },
    },
  },
  brand_modern: {
    label: "Marca Moderno",
    description: "Visual más vibrante con bloques y contraste suave.",
    tokens: {
      catalogo: {
        pageBackground: "bg-gradient-to-b from-[#F4F8F7] to-[#EDF5F2]",
        cardBackground: "bg-white/90 backdrop-blur",
        border: "border-[#CFE2DB]",
        title: "text-[#102A24]",
        subtitle: "text-[#43615A]",
        accent: "text-[#0F766E]",
        badge: "bg-[#D9F3EE] text-[#0F766E]",
      },
      menu: {
        pageBackground: "bg-gradient-to-b from-[#FFF7EE] to-[#FDF0E2]",
        cardBackground: "bg-white/90 backdrop-blur",
        border: "border-[#F0DCC5]",
        title: "text-[#3A2615]",
        subtitle: "text-[#7A5A3B]",
        accent: "text-[#C2410C]",
        badge: "bg-[#FFE9D3] text-[#B45309]",
      },
    },
  },
  brand_contrast: {
    label: "Marca Contraste",
    description: "Estilo marcado con alto contraste y acentos definidos.",
    tokens: {
      catalogo: {
        pageBackground: "bg-[#0F1715]",
        cardBackground: "bg-[#16221E]",
        border: "border-[#264038]",
        title: "text-[#E8F2EE]",
        subtitle: "text-[#B7CAC3]",
        accent: "text-[#6EE7D5]",
        badge: "bg-[#1F3C35] text-[#8DF3E4]",
      },
      menu: {
        pageBackground: "bg-[#1C1713]",
        cardBackground: "bg-[#2A221C]",
        border: "border-[#4B3A2E]",
        title: "text-[#F7EBDD]",
        subtitle: "text-[#DFC8B3]",
        accent: "text-[#FDBA74]",
        badge: "bg-[#493729] text-[#FFD8A8]",
      },
    },
  },
};

export function resolveCatalogThemePreset(value: string | undefined | null): CatalogThemePreset {
  if (value === "brand_modern" || value === "brand_contrast" || value === "brand_classic") {
    return value;
  }
  return "brand_classic";
}

export function getDefaultCatalogThemePreset(view: PublicView): CatalogThemePreset {
  if (view === "menu") {
    return "brand_modern";
  }
  return "brand_classic";
}
