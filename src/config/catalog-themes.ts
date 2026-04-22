export type CatalogThemePreset = "default" | "peach" | "ocean" | "custom";
export type PublicView = "catalogo" | "menu";

export interface CatalogThemeTokens {
  // Fondos
  pageBackground: string;
  headerBg: string;
  cardBackground: string;
  filterBg: string;
  cartBg: string;
  // Bordes
  border: string;
  // Texto
  title: string;
  subtitle: string;
  accent: string;
  // Componentes
  badge: string;
  buttonBg: string;
  buttonText: string;
  // Separador de sección
  sectionBorder: string;
}

export interface CatalogThemeDefinition {
  label: string;
  description: string;
  /** Tres colores hex para el preview del picker: [primario, secundario, fondo] */
  previewColors: [string, string, string];
  tokens: Record<PublicView, CatalogThemeTokens>;
}

export interface CatalogThemeCustom {
  primary: string;   // hex, e.g. "#2B5BB5"
  secondary: string; // hex, e.g. "#7AB3F0"
}

export interface CatalogThemeApiData {
  preset: CatalogThemePreset;
  custom?: CatalogThemeCustom;
}

/** Tokens con flag para saber si es custom (usa CSS variables) */
export interface ResolvedThemeTokens extends CatalogThemeTokens {
  isCustom: boolean;
  /** Solo en custom: mapa de CSS variables → valor hex */
  cssVars?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────
// TEMA 1: MercaConnect — Premium pastel (default)
// ─────────────────────────────────────────────────────────────────
const defaultTheme: CatalogThemeDefinition = {
  label: "MercaConnect",
  description: "Pastel premium con acentos mint suaves y contraste legible.",
  previewColors: ["#5A4A7A", "#BFE8D9", "#FFF8FC"],
  tokens: {
    catalogo: {
      pageBackground: "bg-[#FFF8FC]",
      headerBg: "bg-gradient-to-br from-[#BFE8D9] via-[#D9D4FA] to-[#F8DFF1]",
      cardBackground: "bg-white",
      filterBg: "bg-[#F7EEF9] border border-[#E3D4EF]",
      cartBg: "bg-[#FFF5FB]",
      border: "border-[#E8DAF3]",
      title: "text-[#2F2A3A]",
      subtitle: "text-[#5A5270]",
      accent: "text-[#7A4F8E]",
      badge: "bg-[#EFE5F8] text-[#5A3C74] border border-[#DAC6EA]",
      buttonBg: "bg-[#7A4F8E]",
      buttonText: "text-white",
      sectionBorder: "border-[#E3D1F0]",
    },
    menu: {
      pageBackground: "bg-[#FFF9F4]",
      headerBg: "bg-gradient-to-br from-[#FFDCC8] via-[#F8E2EC] to-[#D7EAF7]",
      cardBackground: "bg-white",
      filterBg: "bg-[#FFF1E8] border border-[#F0D8C8]",
      cartBg: "bg-[#FFF7F1]",
      border: "border-[#F2DECF]",
      title: "text-[#3E2F2B]",
      subtitle: "text-[#6A5650]",
      accent: "text-[#AD5C3B]",
      badge: "bg-[#FFE6D8] text-[#8B4A30] border border-[#F3CDB8]",
      buttonBg: "bg-[#AD5C3B]",
      buttonText: "text-white",
      sectionBorder: "border-[#F0D8C8]",
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// TEMA 2: Cálido — Warm Peach / Terracota pastel
// ─────────────────────────────────────────────────────────────────
const peachTheme: CatalogThemeDefinition = {
  label: "Cálido",
  description: "Tonos durazno y terracota. Ideal para cafeterías, pastelerías y tiendas de ropa.",
  previewColors: ["#D4603A", "#FDDBC8", "#FFF8F3"],
  tokens: {
    catalogo: {
      pageBackground: "bg-[#FFF8F3]",
      headerBg: "bg-gradient-to-br from-[#FDDBC8] to-[#FFC9A8]",
      cardBackground: "bg-white",
      filterBg: "bg-[#FFF0E8] border border-[#F5C4A8]/50",
      cartBg: "bg-[#FFF0E8]",
      border: "border-[#F5C4A8]/60",
      title: "text-[#5C2A1A]",
      subtitle: "text-[#8B4A30]/80",
      accent: "text-[#D4603A]",
      badge: "bg-[#FDDBC8] text-[#D4603A] border border-[#F5C4A8]",
      buttonBg: "bg-[#D4603A]",
      buttonText: "text-white",
      sectionBorder: "border-[#F5C4A8]/70",
    },
    menu: {
      pageBackground: "bg-[#FFF8F3]",
      headerBg: "bg-gradient-to-br from-[#FFC9A8] to-[#FFB494]",
      cardBackground: "bg-white",
      filterBg: "bg-[#FFF0E8] border border-[#F5C4A8]/50",
      cartBg: "bg-[#FFF0E8]",
      border: "border-[#F5C4A8]/60",
      title: "text-[#5C2A1A]",
      subtitle: "text-[#8B4A30]/80",
      accent: "text-[#D4603A]",
      badge: "bg-[#FDDBC8] text-[#D4603A] border border-[#F5C4A8]",
      buttonBg: "bg-[#D4603A]",
      buttonText: "text-white",
      sectionBorder: "border-[#F5C4A8]/60",
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// TEMA 3: Oceánico — Azul / Turquesa pastel
// ─────────────────────────────────────────────────────────────────
const oceanTheme: CatalogThemeDefinition = {
  label: "Oceánico",
  description: "Azul cielo y turquesa suave. Fresco y confiable para cualquier tipo de tienda.",
  previewColors: ["#1A7A9A", "#A8D8EA", "#F0F7FF"],
  tokens: {
    catalogo: {
      pageBackground: "bg-[#F0F7FF]",
      headerBg: "bg-gradient-to-br from-[#A8D8EA] to-[#7EC8E3]",
      cardBackground: "bg-white",
      filterBg: "bg-[#E4F2FB] border border-[#9ECFE8]/50",
      cartBg: "bg-[#E4F2FB]",
      border: "border-[#9ECFE8]/50",
      title: "text-[#0C3D5C]",
      subtitle: "text-[#1A5E80]/75",
      accent: "text-[#1A7A9A]",
      badge: "bg-[#A8D8EA] text-[#0C3D5C] border border-[#9ECFE8]",
      buttonBg: "bg-[#1A7A9A]",
      buttonText: "text-white",
      sectionBorder: "border-[#9ECFE8]/60",
    },
    menu: {
      pageBackground: "bg-[#F0F7FF]",
      headerBg: "bg-gradient-to-br from-[#7EC8E3] to-[#5BB8D8]",
      cardBackground: "bg-white",
      filterBg: "bg-[#E4F2FB] border border-[#9ECFE8]/50",
      cartBg: "bg-[#E4F2FB]",
      border: "border-[#9ECFE8]/50",
      title: "text-[#0C3D5C]",
      subtitle: "text-[#1A5E80]/75",
      accent: "text-[#1A7A9A]",
      badge: "bg-[#A8D8EA] text-[#0C3D5C] border border-[#9ECFE8]",
      buttonBg: "bg-[#1A7A9A]",
      buttonText: "text-white",
      sectionBorder: "border-[#9ECFE8]/55",
    },
  },
};

export const CATALOG_THEME_PRESETS: Record<
  Exclude<CatalogThemePreset, "custom">,
  CatalogThemeDefinition
> = {
  default: defaultTheme,
  peach: peachTheme,
  ocean: oceanTheme,
};

// ─────────────────────────────────────────────────────────────────
// Generador de tema custom
// ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const d = (v: number) =>
    Math.max(0, Math.round(v * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const l = (v: number) =>
    Math.min(255, Math.round(v + (255 - v) * amount))
      .toString(16)
      .padStart(2, "0");
  return `#${l(r)}${l(g)}${l(b)}`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  // Devuelve hex + alpha como rgba string para CSS variables
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Genera tokens completos a partir de colores primario y secundario */
export function generateCustomThemeTokens(
  custom: CatalogThemeCustom,
  _view: PublicView
): ResolvedThemeTokens {
  const { primary, secondary } = custom;
  const lum = relativeLuminance(primary);
  const isDark = lum <= 0.4;

  const textOnPrimary = isDark ? "#FFFFFF" : darken(primary, 0.7);
  const titleColor = isDark ? lighten(primary, 0.85) : darken(primary, 0.6);
  const subtitleColor = isDark ? lighten(primary, 0.65) : darken(primary, 0.4);
  const pageBackground = isDark ? darken(primary, 0.2) : lighten(secondary, 0.7);
  const cardBackground = isDark ? lighten(primary, 0.08) : "#FFFFFF";
  const headerBg = primary;
  const filterBg = isDark ? lighten(primary, 0.12) : lighten(secondary, 0.55);
  const cartBg = isDark ? lighten(primary, 0.1) : lighten(secondary, 0.5);
  const borderColor = hexWithAlpha(secondary, 0.5);
  const accentColor = isDark ? secondary : darken(primary, 0.1);
  const badgeBg = hexWithAlpha(secondary, 0.25);

  const cssVars: Record<string, string> = {
    "--cat-page-bg": pageBackground,
    "--cat-header-bg": headerBg,
    "--cat-card-bg": cardBackground,
    "--cat-filter-bg": filterBg,
    "--cat-cart-bg": cartBg,
    "--cat-border": borderColor,
    "--cat-title": titleColor,
    "--cat-subtitle": subtitleColor,
    "--cat-accent": accentColor,
    "--cat-badge-bg": badgeBg,
    "--cat-badge-text": isDark ? "#FFFFFF" : darken(primary, 0.6),
    "--cat-button-bg": primary,
    "--cat-button-text": textOnPrimary,
    "--cat-section-border": hexWithAlpha(secondary, 0.4),
  };

  return {
    pageBackground: "cat-page-bg",
    headerBg: "cat-header-bg",
    cardBackground: "cat-card-bg",
    filterBg: "cat-filter-bg",
    cartBg: "cat-cart-bg",
    border: "cat-border",
    title: "cat-title",
    subtitle: "cat-subtitle",
    accent: "cat-accent",
    badge: "cat-badge",
    buttonBg: "cat-button-bg",
    buttonText: "cat-button-text",
    sectionBorder: "cat-section-border",
    isCustom: true,
    cssVars,
  };
}

// ─────────────────────────────────────────────────────────────────
// Resolver principal
// ─────────────────────────────────────────────────────────────────

const LEGACY_PRESETS = new Set(["brand_classic", "brand_modern", "brand_contrast"]);

export function resolveCatalogThemePreset(
  value: string | undefined | null
): Exclude<CatalogThemePreset, "custom"> {
  if (value === "peach") return "peach";
  if (value === "ocean") return "ocean";
  return "default";
}

export function resolveThemeTokens(
  theme: CatalogThemeApiData | undefined,
  view: PublicView
): ResolvedThemeTokens {
  if (!theme) {
    return { ...CATALOG_THEME_PRESETS.default.tokens[view], isCustom: false };
  }

  if (
    theme.preset === "custom" &&
    theme.custom?.primary &&
    theme.custom?.secondary
  ) {
    return generateCustomThemeTokens(theme.custom, view);
  }

  const presetKey = LEGACY_PRESETS.has(theme.preset as string)
    ? "default"
    : (theme.preset as Exclude<CatalogThemePreset, "custom">);

  const def =
    CATALOG_THEME_PRESETS[presetKey] ?? CATALOG_THEME_PRESETS.default;
  return { ...def.tokens[view], isCustom: false };
}

export function getDefaultCatalogThemePreset(_view: PublicView): CatalogThemePreset {
  return "default";
}

/**
 * Valor legacy para compatibilidad con validadores que no incluyen "default".
 * @deprecated Usar el preset directamente.
 */
export const CATALOG_THEME_PRESET_API_WIRE = "default" as const;
