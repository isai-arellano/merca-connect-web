export type CatalogThemePreset = "default" | "peach" | "ocean" | "custom";
export type PublicView = "catalogo" | "menu";

/**
 * Paleta semántica → se inyecta en [data-pub-catalog] como --pub-*.
 * Los tokens de clase usan siempre `bg-[var(--pub-…)]` / `text-[var(--pub-…)]` para que
 * preset y custom compartan el mismo mecanismo (evita clases inválidas tipo "cat-page-bg").
 */
export interface SemanticPalette {
  page: string;
  headerFrom: string;
  headerTo: string;
  surface: string;
  surfaceMuted: string;
  cart: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  button: string;
  onButton: string;
  badgeBg: string;
  badgeFg: string;
  sectionBorder: string;
}

export interface CatalogThemeTokens {
  pageBackground: string;
  headerBg: string;
  cardBackground: string;
  filterBg: string;
  cartBg: string;
  border: string;
  title: string;
  subtitle: string;
  accent: string;
  badge: string;
  buttonBg: string;
  buttonText: string;
  sectionBorder: string;
}

export interface CatalogThemeDefinition {
  label: string;
  description: string;
  previewColors: [string, string, string];
  tokens: Record<PublicView, CatalogThemeTokens>;
  /** Paletas por vista para inyección de variables */
  palettes: Record<PublicView, SemanticPalette>;
}

export interface CatalogThemeCustom {
  primary: string;
  secondary: string;
}

export interface CatalogThemeApiData {
  preset: CatalogThemePreset;
  custom?: CatalogThemeCustom;
}

export interface ResolvedThemeTokens extends CatalogThemeTokens {
  /** Siempre presente: variables inyectadas bajo [data-pub-catalog] */
  cssVars: Record<string, string>;
  /** Tema generado a partir de colores del negocio */
  isCustom: boolean;
}

// ── Utilidades de color (preset + custom) ──────────────────────────

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

/** RGB 0–255 → triplete `H S% L%` para variables shadcn (`hsl(var(--token))`). */
function rgbToHslTriplet(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

function isValidRgbChannel(v: number): boolean {
  return Number.isFinite(v) && v >= 0 && v <= 255;
}

/**
 * Convierte un color CSS (`#hex`, `rgb()`, `rgba()`) a triplete HSL para variables shadcn.
 * La opacidad de `rgba` se ignora (solo se usan los canales RGB).
 */
export function colorToShadcnHslTriplet(value: string): string | null {
  const v = value.trim();
  if (v.startsWith("#")) {
    try {
      const [r, g, b] = hexToRgb(v);
      if (!isValidRgbChannel(r) || !isValidRgbChannel(g) || !isValidRgbChannel(b)) return null;
      return rgbToHslTriplet(r, g, b);
    } catch {
      return null;
    }
  }
  const m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if (!isValidRgbChannel(r) || !isValidRgbChannel(g) || !isValidRgbChannel(b)) return null;
    return rgbToHslTriplet(r, g, b);
  }
  return null;
}

/**
 * Declaraciones CSS (`--background: …;`) alineadas con `--pub-*` del catálogo público
 * para que Card/Button/Input hereden el tema del negocio vía tokens shadcn.
 */
export function buildShadcnBridgeCssBlockFromPubVars(pub: Record<string, string>): string {
  const t = (key: string, fallback: string) =>
    colorToShadcnHslTriplet(pub[key] ?? "") ?? fallback;

  const background = t("--pub-page", "0 0% 100%");
  const foreground = t("--pub-text", "240 10% 3.9%");
  const card = t("--pub-surface", background);
  const muted = t("--pub-surface-muted", "220 14% 96%");
  const mutedForeground = t("--pub-text-muted", "240 4% 46%");
  const border = t("--pub-border", "220 13% 91%");
  const primary = t("--pub-button", "240 6% 10%");
  const primaryForeground = t("--pub-on-button", "0 0% 98%");
  const accentHue = t("--pub-accent", "221 83% 53%");

  const entries: [string, string][] = [
    ["--background", background],
    ["--foreground", foreground],
    ["--card", card],
    ["--card-foreground", foreground],
    ["--popover", card],
    ["--popover-foreground", foreground],
    ["--primary", primary],
    ["--primary-foreground", primaryForeground],
    ["--secondary", muted],
    ["--secondary-foreground", foreground],
    ["--muted", muted],
    ["--muted-foreground", mutedForeground],
    ["--accent", muted],
    ["--accent-foreground", accentHue],
    ["--border", border],
    ["--input", border],
    ["--ring", accentHue],
  ];
  return entries.map(([k, v]) => `${k}:${v}`).join(";");
}

export function relativeLuminance(hex: string): number {
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
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function paletteToCssVars(p: SemanticPalette): Record<string, string> {
  return {
    "--pub-page": p.page,
    "--pub-header-from": p.headerFrom,
    "--pub-header-to": p.headerTo,
    "--pub-surface": p.surface,
    "--pub-surface-muted": p.surfaceMuted,
    "--pub-cart": p.cart,
    "--pub-border": p.border,
    "--pub-text": p.text,
    "--pub-text-muted": p.textMuted,
    "--pub-accent": p.accent,
    "--pub-button": p.button,
    "--pub-on-button": p.onButton,
    "--pub-badge-bg": p.badgeBg,
    "--pub-badge-fg": p.badgeFg,
    "--pub-section-border": p.sectionBorder,
  };
}

/** Mismas clases para preset y custom: referencias a var(--pub-*) */
const THEME_CLASSES: CatalogThemeTokens = {
  pageBackground: "bg-[var(--pub-page)]",
  headerBg: "bg-gradient-to-br from-[var(--pub-header-from)] to-[var(--pub-header-to)]",
  cardBackground: "bg-[var(--pub-surface)]",
  filterBg:
    "bg-[var(--pub-surface-muted)] border border-[color:var(--pub-border)]",
  cartBg: "bg-[var(--pub-cart)]",
  border: "border border-[color:var(--pub-border)]",
  title: "text-[var(--pub-text)]",
  subtitle: "text-[var(--pub-text-muted)]",
  accent: "text-[var(--pub-accent)]",
  badge:
    "bg-[var(--pub-badge-bg)] text-[var(--pub-badge-fg)] border border-[color:var(--pub-border)]",
  buttonBg: "bg-[var(--pub-button)]",
  buttonText: "text-[var(--pub-on-button)]",
  sectionBorder: "border-[color:var(--pub-section-border)]",
};

/** Fondos: blanco; el color va en tipografía, acentos e iconos (no al page). */
const BG_PAGE = "#FFFFFF";
const BG_RAIL = "#F5F5F5";

// ── Preset: neutro — página blanca, carril gris mínimo para filtros ─
const defaultNeutralCatalogo: SemanticPalette = {
  page: BG_PAGE,
  headerFrom: "#FFFFFF",
  headerTo: "#E4E4E7",
  surface: BG_PAGE,
  surfaceMuted: BG_RAIL,
  cart: BG_PAGE,
  border: "rgba(24, 24, 27, 0.1)",
  text: "#18181B",
  textMuted: "#3F3F46",
  accent: "#2563EB",
  button: "#18181B",
  onButton: "#FFFFFF",
  badgeBg: BG_RAIL,
  badgeFg: "#27272A",
  sectionBorder: "rgba(24, 24, 27, 0.12)",
};

const defaultNeutralMenu: SemanticPalette = {
  ...defaultNeutralCatalogo,
  accent: "#C2410C",
  button: "#1C1917",
  onButton: "#FFFFFF",
  badgeFg: "#431407",
};

const defaultTheme: CatalogThemeDefinition = {
  label: "MercaConnect",
  description: "Fondo claro (blanco) y color en textos, botones y acentos.",
  previewColors: ["#18181B", "#2563EB", "#FFFFFF"],
  tokens: { catalogo: THEME_CLASSES, menu: THEME_CLASSES },
  palettes: {
    catalogo: defaultNeutralCatalogo,
    menu: defaultNeutralMenu,
  },
};

// ── Peach — fondo blanco, acento naranja/terracota intenso ───────────
const peachCatalogo: SemanticPalette = {
  page: BG_PAGE,
  headerFrom: "#FFFFFF",
  headerTo: "#E7E5E4",
  surface: BG_PAGE,
  surfaceMuted: BG_RAIL,
  cart: BG_PAGE,
  border: "rgba(194, 65, 12, 0.15)",
  text: "#431407",
  textMuted: "#78716C",
  accent: "#EA580C",
  button: "#C2410C",
  onButton: "#FFFFFF",
  badgeBg: BG_RAIL,
  badgeFg: "#9A3412",
  sectionBorder: "rgba(194, 65, 12, 0.2)",
};

const peachMenu: SemanticPalette = {
  ...peachCatalogo,
  accent: "#C2410C",
  button: "#9A3412",
};

// ── Ocean — fondo blanco, acento azul vivo ─────────────────────────
const oceanCatalogo: SemanticPalette = {
  page: BG_PAGE,
  headerFrom: "#FFFFFF",
  headerTo: "#E4E4E7",
  surface: BG_PAGE,
  surfaceMuted: BG_RAIL,
  cart: BG_PAGE,
  border: "rgba(3, 105, 161, 0.12)",
  text: "#0C4A6E",
  textMuted: "#475569",
  accent: "#0284C7",
  button: "#0369A1",
  onButton: "#FFFFFF",
  badgeBg: BG_RAIL,
  badgeFg: "#075985",
  sectionBorder: "rgba(3, 105, 161, 0.18)",
};

const oceanMenu: SemanticPalette = {
  ...oceanCatalogo,
  accent: "#0369A1",
  button: "#0E7490",
};

const peachTheme: CatalogThemeDefinition = {
  label: "Cálido",
  description: "Acento cálido intenso sobre fondo blanco.",
  previewColors: ["#C2410C", "#EA580C", "#FFFFFF"],
  tokens: { catalogo: THEME_CLASSES, menu: THEME_CLASSES },
  palettes: { catalogo: peachCatalogo, menu: peachMenu },
};

const oceanTheme: CatalogThemeDefinition = {
  label: "Oceánico",
  description: "Acento azul sobre blanco, lectura nítida.",
  previewColors: ["#0369A1", "#0284C7", "#FFFFFF"],
  tokens: { catalogo: THEME_CLASSES, menu: THEME_CLASSES },
  palettes: { catalogo: oceanCatalogo, menu: oceanMenu },
};

export const CATALOG_THEME_PRESETS: Record<
  Exclude<CatalogThemePreset, "custom">,
  CatalogThemeDefinition
> = {
  default: defaultTheme,
  peach: peachTheme,
  ocean: oceanTheme,
};

// ── Custom: a partir de primary + secondary (contraste ajustado) ─────

export function generateCustomThemeTokens(
  custom: CatalogThemeCustom,
  _view: PublicView
): ResolvedThemeTokens {
  const { primary, secondary } = custom;
  const lumP = relativeLuminance(primary);
  const onPrimary = lumP > 0.45 ? "#0A0A0B" : "#FAFAFA";

  const textMain = lumP < 0.35 ? "#18181B" : darken(primary, 0.45);
  const textSub = lumP < 0.4 ? "#52525B" : darken(secondary, 0.15);
  const accent = lumP > 0.5 ? darken(primary, 0.1) : secondary;
  const borderNeutral = "rgba(24, 24, 27, 0.1)";

  const p: SemanticPalette = {
    page: BG_PAGE,
    headerFrom: "#FFFFFF",
    headerTo: lumP > 0.6 ? "#F4F4F5" : lighten(primary, 0.92),
    surface: BG_PAGE,
    surfaceMuted: BG_RAIL,
    cart: BG_PAGE,
    border: borderNeutral,
    text: textMain,
    textMuted: textSub,
    accent,
    button: primary,
    onButton: onPrimary,
    badgeBg: BG_RAIL,
    badgeFg: lumP > 0.5 ? darken(primary, 0.35) : darken(secondary, 0.1),
    sectionBorder: hexWithAlpha(primary, 0.2),
  };

  return {
    ...THEME_CLASSES,
    cssVars: paletteToCssVars(p),
    isCustom: true,
  };
}

// ── Resolver principal ─────────────────────────────────────────────

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
    return {
      ...THEME_CLASSES,
      cssVars: paletteToCssVars(CATALOG_THEME_PRESETS.default.palettes[view]),
      isCustom: false,
    };
  }

  if (theme.preset === "custom" && theme.custom?.primary && theme.custom?.secondary) {
    return generateCustomThemeTokens(theme.custom, view);
  }

  const presetKey = LEGACY_PRESETS.has(theme.preset as string)
    ? "default"
    : (theme.preset as Exclude<CatalogThemePreset, "custom">);

  const def = CATALOG_THEME_PRESETS[presetKey] ?? CATALOG_THEME_PRESETS.default;
  return {
    ...THEME_CLASSES,
    cssVars: paletteToCssVars(def.palettes[view]),
    isCustom: false,
  };
}

export function getDefaultCatalogThemePreset(_view: PublicView): CatalogThemePreset {
  return "default";
}

export const CATALOG_THEME_PRESET_API_WIRE = "default" as const;
