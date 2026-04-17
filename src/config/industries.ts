/**
 * Industrias: la fuente de verdad es la API (`GET /api/v1/catalog/industries` o `GET /api/v1/industries`).
 * `FALLBACK_INDUSTRIES` evita pantalla vacía si la API no responde (misma forma que el seed).
 */

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
}

export function industryApiRowToConfig(row: IndustryApiRow): IndustryConfig {
    return {
        view: row.view,
        label: row.label,
        productLabel: row.product_label,
        productFields: row.product_fields,
        relevantUnits: row.relevant_units,
        features: row.features,
    };
}

export function buildIndustryMapFromApi(rows: IndustryApiRow[]): Record<string, IndustryConfig> {
    const m: Record<string, IndustryConfig> = {};
    for (const row of rows) {
        if (row.is_active) {
            m[row.slug] = industryApiRowToConfig(row);
        }
    }
    return m;
}

/** Semilla alineada con `alembic/versions/m1n2o3p4q5r6_add_industries_table.py` */
export const FALLBACK_INDUSTRIES: Record<string, IndustryConfig> = {
    abarrotera: {
        view: "catalogo",
        label: "Abarrotera",
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
    },
};

export function getIndustryConfig(
    type: string | undefined | null,
    map: Record<string, IndustryConfig> = FALLBACK_INDUSTRIES,
): IndustryConfig {
    const slug = (type ?? "abarrotera").trim() || "abarrotera";
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
