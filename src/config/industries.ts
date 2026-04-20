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
    sort_order: number;
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
    tienda_online: "tienda_digital",
    tienda_electronica: "tienda_digital",
    tienda_ropa: "tienda_digital",
};

export function canonicalIndustrySlug(slug: string | undefined | null): string {
    const s = (slug ?? "abarrotera").trim() || "abarrotera";
    return LEGACY_INDUSTRY_SLUG_ALIASES[s] ?? s;
}

/** Semilla alineada con migraciones `industries` (lista plana MVP). */
export const FALLBACK_INDUSTRIES: Record<string, IndustryConfig> = {
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
        label: "Cafetería",
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
    ferreteria: {
        view: "catalogo",
        label: "Ferretería",
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
    tienda_digital: {
        view: "catalogo",
        label: "Tienda digital",
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
        relevantUnits: ["pza", "und"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "digital_service",
    },
    tienda_ropa: {
        view: "catalogo",
        label: "Tienda de Ropa",
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
        business_category: "online_store",
    },
    tienda_electronica: {
        view: "catalogo",
        label: "Tienda en línea (electrónicos)",
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
    servicios: {
        view: "catalogo",
        label: "Servicios",
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
    tienda_online: {
        view: "catalogo",
        label: "Tienda en línea",
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
        relevantUnits: ["pza", "und"],
        features: { hasTables: false, hasPrescriptions: false },
        business_category: "online_store",
    },
};

export const BUSINESS_CATEGORIES = [
    { value: "physical_store",   label: "Tienda física",              icon: "Store",          description: "Productos físicos con pickup o entrega local" },
    { value: "physical_digital", label: "Tienda física y en línea",   icon: "ShoppingBag",    description: "Vendes en local y también haces envíos" },
    { value: "online_store",     label: "Tienda en línea",            icon: "Package",        description: "Ventas con envío nacional o paquetería" },
    { value: "restaurant",       label: "Comida",                     icon: "UtensilsCrossed", description: "Menú, pedidos, delivery o pickup" },
    { value: "field_service",    label: "Servicio a domicilio",       icon: "Wrench",         description: "Instalaciones, visitas técnicas, servicios en sitio" },
    { value: "digital_service",  label: "Servicio o producto digital", icon: "Monitor",      description: "Sin entrega física: cursos, software, consultoría" },
] as const satisfies ReadonlyArray<{ value: BusinessCategory; label: string; icon: string; description: string }>;

/** Orden del onboarding cuando la API no está disponible (lista plana). */
export const FLAT_INDUSTRY_SLUGS_ORDER: readonly string[] = [
    "abarrotera",
    "ferreteria",
    "farmacia",
    "restaurante",
    "cafeteria",
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

/** @deprecated Usar `IndustrySlug` o `string` */
export type IndustryType = IndustrySlug;

/** @deprecated Usar `FALLBACK_INDUSTRIES` o datos de `useIndustries()` */
export const INDUSTRIES = FALLBACK_INDUSTRIES;
