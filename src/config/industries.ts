/**
 * Industrias: la fuente de verdad es la API (`GET /api/v1/catalog/industries` o `GET /api/v1/industries`).
 * `FALLBACK_INDUSTRIES` evita pantalla vacía si la API no responde (misma forma que el seed).
 */

import type { BusinessCategory } from "@/types/api";

export type CatalogView = "catalogo" | "menu";

export type PublicCatalogRoute = "catalogo" | "menu";

/** Slug de industria (coincide con `businesses.type` en API). */
export type IndustrySlug = string;

export interface IndustryConfig {
    view: CatalogView;
    label: string;
    productLabel: string;
    productFields: {
        showStock: boolean;
        showBarcode: boolean;
        showIngredients: boolean;
        showActiveSubstance: boolean;
        showPreparationTime: boolean;
        showDimensions: boolean;
        showSKU: boolean;
    };
    relevantUnits: string[];
    features: {
        hasTables: boolean;
        hasPrescriptions: boolean;
    };
    business_category?: BusinessCategory;
}

/** Respuesta JSON de la API (snake_case). */
export interface IndustryApiRow {
    slug: string;
    label: string;
    view: CatalogView;
    product_label: string;
    product_fields: IndustryConfig["productFields"];
    relevant_units: string[];
    features: IndustryConfig["features"];
    is_active: boolean;
    parent_slug?: string | null;
    /** false = grupo padre (no se guarda en negocio); omitido en despliegues antiguos = elegible */
    is_selectable?: boolean;
    business_category?: BusinessCategory;
}

/** Misma regla que Configuración > Tipo de negocio / Industria y GET .../catalog/industries. */
export function isIndustryEligibleForBusinessType(row: IndustryApiRow): boolean {
    return row.is_active && row.is_selectable !== false;
}

export function industryApiRowToConfig(row: IndustryApiRow): IndustryConfig {
    return {
        view: row.view,
        label: row.label,
        productLabel: row.product_label,
        productFields: row.product_fields,
        relevantUnits: row.relevant_units,
        features: row.features,
        business_category: row.business_category,
    };
}

export function buildIndustryMapFromApi(rows: IndustryApiRow[]): Record<string, IndustryConfig> {
    const m: Record<string, IndustryConfig> = {};
    for (const row of rows) {
        if (isIndustryEligibleForBusinessType(row)) {
            m[row.slug] = industryApiRowToConfig(row);
        }
    }
    return m;
}

/** Slugs antiguos → slug canónico para etiquetas y campos de producto. */
const LEGACY_INDUSTRY_SLUG_ALIASES: Record<string, string> = {
    tienda_electronica: "tienda_online",
    // tienda_online y tienda_ropa ahora son slugs canónicos propios
};

export function canonicalIndustrySlug(slug: string | undefined | null): string {
    const s = (slug ?? "abarrotera").trim() || "abarrotera";
    return LEGACY_INDUSTRY_SLUG_ALIASES[s] ?? s;
}

/** Semilla alineada con migraciones `industries` (lista plana MVP). */
export const FALLBACK_INDUSTRIES: Record<string, IndustryConfig> = {
    // ── Tiendas físicas ────────────────────────────────────────────────────
    abarrotera: {
        view: "catalogo",
        label: "Abarrotes / miscelánea",
        productLabel: "Producto",
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: false,
            showSKU: true,
        },
        relevantUnits: ["pza", "und", "kg", "g", "L"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "physical_store",
    },
    ferreteria: {
        view: "catalogo",
        label: "Ferretería / materiales",
        productLabel: "Producto",
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: true,
            showSKU: true,
        },
        relevantUnits: ["pza", "und", "m", "cm", "kg"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "physical_store",
    },
    farmacia: {
        view: "catalogo",
        label: "Farmacia",
        productLabel: "Medicamento",
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: true,
            showPreparationTime: false,
            showDimensions: false,
            showSKU: true,
        },
        relevantUnits: ["pza", "und", "g", "L"],
        features: { hasTables: false, hasPrescriptions: true },
        business_category: "physical_store",
    },
    tienda_ropa: {
        view: "catalogo",
        label: "Ropa y accesorios",
        productLabel: "Prenda",
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: false,
            showSKU: true,
        },
        relevantUnits: ["pza", "und"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "physical_store",
    },
    // ── Comida y bebidas ───────────────────────────────────────────────────
    restaurante: {
        view: "menu",
        label: "Restaurante",
        productLabel: "Platillo",
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: true,
            showActiveSubstance: false,
            showPreparationTime: true,
            showDimensions: false,
            showSKU: false,
        },
        relevantUnits: ["por", "und"],
        features: { hasTables: true, hasPrescriptions: false },
        business_category: "restaurant",
    },
    cafeteria: {
        view: "menu",
        label: "Cafetería / panadería",
        productLabel: "Producto",
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: true,
            showActiveSubstance: false,
            showPreparationTime: true,
            showDimensions: false,
            showSKU: false,
        },
        relevantUnits: ["por", "und", "L"],
        features: { hasTables: true, hasPrescriptions: false },
        business_category: "restaurant",
    },
    comida_rapida: {
        view: "menu",
        label: "Comida rápida / tacos / pizza",
        productLabel: "Platillo",
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: true,
            showActiveSubstance: false,
            showPreparationTime: true,
            showDimensions: false,
            showSKU: false,
        },
        relevantUnits: ["por", "und", "pza"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "restaurant",
    },
    // ── Tiendas en línea ───────────────────────────────────────────────────
    tienda_online: {
        view: "catalogo",
        label: "Tienda en línea / e-commerce",
        productLabel: "Producto",
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: true,
            showSKU: true,
        },
        relevantUnits: ["pza", "und", "kg"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "online_store",
    },
    // ── Servicios ──────────────────────────────────────────────────────────
    servicios: {
        view: "catalogo",
        label: "Servicios a domicilio",
        productLabel: "Servicio",
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: false,
            showSKU: false,
        },
        relevantUnits: ["hr", "ses", "día", "sem"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "field_service",
    },
    tienda_digital: {
        view: "catalogo",
        label: "Productos o servicios digitales",
        productLabel: "Producto",
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
            showDimensions: false,
            showSKU: true,
        },
        relevantUnits: ["pza", "und", "ses"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "digital_service",
    },
};

export const BUSINESS_CATEGORIES = [
    { value: "physical_store",  label: "Tienda física",         icon: "Store",           description: "Vendes productos en local con entrega o pickup" },
    { value: "restaurant",      label: "Comida y bebidas",       icon: "UtensilsCrossed", description: "Restaurantes, cafeterías, taquerías, dark kitchens" },
    { value: "online_store",    label: "Tienda en línea",        icon: "Package",         description: "Ventas con envío a todo el país o paquetería" },
    { value: "field_service",   label: "Servicio a domicilio",   icon: "Wrench",          description: "Instalaciones, visitas técnicas, servicios en sitio" },
    { value: "digital_service", label: "Producto o servicio digital", icon: "Monitor",    description: "Cursos, software, consultoría — sin entrega física" },
] as const satisfies ReadonlyArray<{ value: BusinessCategory; label: string; icon: string; description: string }>;

/** Orden del onboarding cuando la API no está disponible (lista plana). */
export const FLAT_INDUSTRY_SLUGS_ORDER: readonly string[] = [
    "abarrotera",
    "ferreteria",
    "farmacia",
    "tienda_ropa",
    "restaurante",
    "cafeteria",
    "comida_rapida",
    "tienda_online",
    "servicios",
    "tienda_digital",
];

export function getIndustryConfig(
    type: string | undefined | null,
    map: Record<string, IndustryConfig> = FALLBACK_INDUSTRIES,
): IndustryConfig {
    const slug = canonicalIndustrySlug(type);
    return map[slug] ?? FALLBACK_INDUSTRIES[slug] ?? FALLBACK_INDUSTRIES.abarrotera;
}

export function getPublicCatalogRoute(
    type: string | undefined | null,
    map: Record<string, IndustryConfig> = FALLBACK_INDUSTRIES,
): PublicCatalogRoute {
    const industry = getIndustryConfig(type, map);
    return industry.view === "menu" ? "menu" : "catalogo";
}

/** Título del módulo en panel (sidebar, h1): Menú vs Catálogo. */
export function catalogModuleTitle(config: IndustryConfig): "Menú" | "Catálogo" {
    return config.view === "menu" ? "Menú" : "Catálogo";
}

/** Misma distinción en minúsculas para frases (“tu menú”, “tu catálogo”). */
export function catalogModuleLower(config: IndustryConfig): "menú" | "catálogo" {
    return config.view === "menu" ? "menú" : "catálogo";
}

/**
 * Plural en español del sustantivo de ítem (productLabel).
 * Por defecto añade “s” (Producto→Productos, Servicio→Servicios, Platillo→Platillos).
 */
export function pluralProductLabel(productLabel: string): string {
    const t = productLabel.trim();
    if (!t) return "ítems";
    return `${t}s`;
}

/** @deprecated Usar `IndustrySlug` o `string` */
export type IndustryType = IndustrySlug;

/** @deprecated Usar `FALLBACK_INDUSTRIES` o datos de `useIndustries()` */
export const INDUSTRIES = FALLBACK_INDUSTRIES;
