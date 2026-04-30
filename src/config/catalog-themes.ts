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
  const hexWithoutHash = hex.replace("#", "");
  const expandedHex =
    hexWithoutHash.length === 3
      ? hexWithoutHash
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : hexWithoutHash;
  const packedRgb = parseInt(expandedHex, 16);
  return [(packedRgb >> 16) & 255, (packedRgb >> 8) & 255, packedRgb & 255];
}

/**
 * RGB canales 0–255 → triplete `H S% L%` para usar en `hsl(var(--token))` (Tailwind / tokens globales).
 * Las variables r/g/b en 0–1 son el paso estándar del algoritmo HSL.
 */
function rgbToHslTriplet(red255: number, green255: number, blue255: number): string {
  const r = red255 / 255;
  const g = green255 / 255;
  const b = blue255 / 255;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  let hue01 = 0;
  let saturation01 = 0;
  const lightness01 = (maxChannel + minChannel) / 2;
  if (maxChannel !== minChannel) {
    const chroma = maxChannel - minChannel;
    saturation01 =
      lightness01 > 0.5 ? chroma / (2 - maxChannel - minChannel) : chroma / (maxChannel + minChannel);
    switch (maxChannel) {
      case r:
        hue01 = (g - b) / chroma + (g < b ? 6 : 0);
        break;
      case g:
        hue01 = (b - r) / chroma + 2;
        break;
      default:
        hue01 = (r - g) / chroma + 4;
        break;
    }
    hue01 /= 6;
  }
  const hueDegrees = Math.round(hue01 * 360);
  const saturationPercent = Math.round(saturation01 * 100);
  const lightnessPercent = Math.round(lightness01 * 100);
  return `${hueDegrees} ${saturationPercent}% ${lightnessPercent}%`;
}

function isValidRgbChannel(channel: number): boolean {
  return Number.isFinite(channel) && channel >= 0 && channel <= 255;
}

/**
 * Convierte un color CSS (`#hex`, `rgb()`, `rgba()`) a triplete HSL para `hsl(var(--…))`.
 * La opacidad de `rgba` se ignora (solo se usan los canales RGB).
 */
export function colorToHslTripletForCssVar(value: string): string | null {
  const trimmedColor = value.trim();
  if (trimmedColor.startsWith("#")) {
    try {
      const [red, green, blue] = hexToRgb(trimmedColor);
      if (!isValidRgbChannel(red) || !isValidRgbChannel(green) || !isValidRgbChannel(blue)) {
        return null;
      }
      return rgbToHslTriplet(red, green, blue);
    } catch {
      return null;
    }
  }
  const rgbFunctionMatch = trimmedColor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbFunctionMatch) {
    const red = Number(rgbFunctionMatch[1]);
    const green = Number(rgbFunctionMatch[2]);
    const blue = Number(rgbFunctionMatch[3]);
    if (!isValidRgbChannel(red) || !isValidRgbChannel(green) || !isValidRgbChannel(blue)) {
      return null;
    }
    return rgbToHslTriplet(red, green, blue);
  }
  return null;
}

/**
 * Genera un bloque CSS con `--background`, `--primary`, etc. a partir de las variables `--pub-*`
 * del tema del catálogo, para inyectarlas en `:root` y que el panel (drawer portaled, etc.) use el mismo
 * esquema de color que el bloque `[data-pub-catalog]`.
 */
export function buildGlobalUiThemeCssFromPubVars(pubCssVariables: Record<string, string>): string {
  /** `--pub-*` (hex/rgba) → triplete HSL consumido por los tokens globales de UI. */
  const hslTripletFromPubKey = (pubKey: string, fallbackHslTriplet: string): string =>
    colorToHslTripletForCssVar(pubCssVariables[pubKey] ?? "") ?? fallbackHslTriplet;

  const pageBackgroundHsl = hslTripletFromPubKey("--pub-page", "0 0% 100%");
  const mainTextHsl = hslTripletFromPubKey("--pub-text", "240 10% 3.9%");
  const cardSurfaceHsl = hslTripletFromPubKey("--pub-surface", pageBackgroundHsl);
  const mutedSurfaceHsl = hslTripletFromPubKey("--pub-surface-muted", "220 14% 96%");
  const mutedTextHsl = hslTripletFromPubKey("--pub-text-muted", "240 4% 46%");
  const borderHsl = hslTripletFromPubKey("--pub-border", "220 13% 91%");
  const primaryButtonHsl = hslTripletFromPubKey("--pub-button", "240 6% 10%");
  const onPrimaryButtonTextHsl = hslTripletFromPubKey("--pub-on-button", "0 0% 98%");
  const accentBrandHsl = hslTripletFromPubKey("--pub-accent", "221 83% 53%");

  const globalUiTokenVariablePairs: [string, string][] = [
    ["--background", pageBackgroundHsl],
    ["--foreground", mainTextHsl],
    ["--card", cardSurfaceHsl],
    ["--card-foreground", mainTextHsl],
    ["--popover", cardSurfaceHsl],
    ["--popover-foreground", mainTextHsl],
    ["--primary", primaryButtonHsl],
    ["--primary-foreground", onPrimaryButtonTextHsl],
    ["--secondary", mutedSurfaceHsl],
    ["--secondary-foreground", mainTextHsl],
    ["--muted", mutedSurfaceHsl],
    ["--muted-foreground", mutedTextHsl],
    ["--accent", mutedSurfaceHsl],
    ["--accent-foreground", accentBrandHsl],
    ["--border", borderHsl],
    ["--input", borderHsl],
    ["--ring", accentBrandHsl],
  ];
  return globalUiTokenVariablePairs
    .map(([cssVariableName, hslTriplet]) => `${cssVariableName}:${hslTriplet}`)
    .join(";");
}

export function relativeLuminance(hex: string): number {
  const [redLinear, greenLinear, blueLinear] = hexToRgb(hex).map((channel0to255) => {
    const normalized = channel0to255 / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * redLinear + 0.7152 * greenLinear + 0.0722 * blueLinear;
}

function darken(hex: string, amount: number): string {
  const [red255, green255, blue255] = hexToRgb(hex);
  const channelToDarkenedHexByte = (channel0to255: number) =>
    Math.max(0, Math.round(channel0to255 * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  return `#${channelToDarkenedHexByte(red255)}${channelToDarkenedHexByte(green255)}${channelToDarkenedHexByte(blue255)}`;
}

function lighten(hex: string, amount: number): string {
  const [red255, green255, blue255] = hexToRgb(hex);
  const channelToLightenedHexByte = (channel0to255: number) =>
    Math.min(255, Math.round(channel0to255 + (255 - channel0to255) * amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channelToLightenedHexByte(red255)}${channelToLightenedHexByte(green255)}${channelToLightenedHexByte(blue255)}`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const [red255, green255, blue255] = hexToRgb(hex);
  return `rgba(${red255},${green255},${blue255},${alpha})`;
}

function mixWithWhite(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount))
    .toString(16)
    .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function paletteToCssVars(palette: SemanticPalette): Record<string, string> {
  return {
    "--pub-page": palette.page,
    "--pub-header-from": palette.headerFrom,
    "--pub-header-to": palette.headerTo,
    "--pub-surface": palette.surface,
    "--pub-surface-muted": palette.surfaceMuted,
    "--pub-cart": palette.cart,
    "--pub-border": palette.border,
    "--pub-text": palette.text,
    "--pub-text-muted": palette.textMuted,
    "--pub-accent": palette.accent,
    "--pub-button": palette.button,
    "--pub-on-button": palette.onButton,
    "--pub-badge-bg": palette.badgeBg,
    "--pub-badge-fg": palette.badgeFg,
    "--pub-section-border": palette.sectionBorder,
  };
}

/** Mismas clases para preset y custom: referencias a var(--pub-*) */
const THEME_CLASSES: CatalogThemeTokens = {
  pageBackground: "bg-[var(--pub-page)]",
  headerBg: "bg-gradient-to-br from-[var(--pub-header-from)] to-[var(--pub-header-to)]",
  cardBackground: "bg-white bg-[var(--pub-surface)]",
  filterBg:
    "bg-white bg-[var(--pub-surface-muted)] border border-[color:var(--pub-border)]",
  cartBg: "bg-white bg-[var(--pub-cart)]",
  border: "border border-[color:var(--pub-border)]",
  title: "text-[color:var(--pub-text)]",
  subtitle: "text-[color:var(--pub-text-muted)]",
  accent: "text-[color:var(--pub-accent)]",
  badge:
    "bg-[var(--pub-badge-bg)] text-[color:var(--pub-badge-fg)] border border-[color:var(--pub-border)]",
  buttonBg: "bg-[color:var(--pub-button)]",
  buttonText: "text-[color:var(--pub-on-button)]",
  sectionBorder: "border-[color:var(--pub-section-border)]",
};

/** Fondos estructurales tipo skeleton (página gris claro, tarjetas blancas) */
const BG_PAGE = "#F4F4F5"; // zinc-100
const BG_SURFACE = "#FFFFFF"; // tarjetas blancas para que resalten
const BG_RAIL = "#E4E4E7"; // zinc-200 para filtros/carriles

// ── Preset: neutro — página blanca, carril gris mínimo para filtros ─
const defaultNeutralCatalogo: SemanticPalette = {
  page: BG_PAGE,
  headerFrom: BG_SURFACE,
  headerTo: BG_PAGE,
  surface: BG_SURFACE,
  surfaceMuted: BG_RAIL,
  cart: BG_SURFACE,
  border: "rgba(24, 24, 27, 0.08)",
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
  page: "#FFF7ED", // orange-50
  headerFrom: "#FFFFFF",
  headerTo: "#FFF7ED",
  surface: "#FFFFFF",
  surfaceMuted: "#FFEDD5", // orange-100
  cart: "#FFFFFF",
  border: "rgba(194, 65, 12, 0.1)",
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
  page: "#F0F9FF", // sky-50
  headerFrom: "#FFFFFF",
  headerTo: "#F0F9FF",
  surface: "#FFFFFF",
  surfaceMuted: "#E0F2FE", // sky-100
  cart: "#FFFFFF",
  border: "rgba(3, 105, 161, 0.1)",
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
  const primaryLuminance = relativeLuminance(primary);
  const textOnPrimaryButton = primaryLuminance > 0.45 ? "#0A0A0B" : "#FAFAFA";

  const mainTextHex = primaryLuminance < 0.35 ? "#18181B" : darken(primary, 0.45);
  const mutedTextHex = primaryLuminance < 0.4 ? "#52525B" : darken(secondary, 0.15);
  const accentHex = primaryLuminance > 0.5 ? darken(primary, 0.1) : secondary;
  const neutralBorderRgba = "rgba(24, 24, 27, 0.1)";

  // Fondo tintado sutilmente: mezcla 4% del color principal con blanco para un efecto de marca muy elegante y limpio.
  const pageTint = mixWithWhite(primary, 0.04);

  const customPalette: SemanticPalette = {
    page: pageTint,
    headerFrom: BG_SURFACE,
    headerTo: mixWithWhite(primary, 0.08),
    surface: BG_SURFACE,
    surfaceMuted: mixWithWhite(primary, 0.12),
    cart: BG_SURFACE,
    border: neutralBorderRgba,
    text: mainTextHex,
    textMuted: mutedTextHex,
    accent: accentHex,
    button: primary,
    onButton: textOnPrimaryButton,
    badgeBg: BG_RAIL,
    badgeFg: primaryLuminance > 0.5 ? darken(primary, 0.35) : darken(secondary, 0.1),
    sectionBorder: hexWithAlpha(primary, 0.2),
  };

  return {
    ...THEME_CLASSES,
    cssVars: paletteToCssVars(customPalette),
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
