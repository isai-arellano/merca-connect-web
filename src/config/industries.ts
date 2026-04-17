export type IndustryType =
    | "abarrotera"
    | "restaurante"
    | "cafeteria"
    | "ferreteria"
    | "tienda_ropa"
    | "servicios"
    | "farmacia";

export type CatalogView = "catalogo" | "menu";

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

export type PublicCatalogRoute = "catalogo" | "menu";

export const INDUSTRIES: Record<IndustryType, IndustryConfig> = {
    abarrotera: {
        view: "catalogo",
        label: "Abarrotera",
        productLabel: "Producto",
        productFields: {
            showStock: true, showBarcode: true, showIngredients: false,
            showActiveSubstance: false, showPreparationTime: false, showDimensions: false, showSKU: true,
        },
        relevantUnits: ["pza", "und", "kg", "g", "L"],
        features: { hasTables: false, hasPrescriptions: false },
    },
    restaurante: {
        view: "menu",
        label: "Restaurante",
        productLabel: "Platillo",
        productFields: {
            showStock: false, showBarcode: false, showIngredients: true,
            showActiveSubstance: false, showPreparationTime: true, showDimensions: false, showSKU: false,
        },
        relevantUnits: ["por", "und"],
        features: { hasTables: true, hasPrescriptions: false },
    },
    cafeteria: {
        view: "menu",
        label: "Cafetería",
        productLabel: "Producto",
        productFields: {
            showStock: false, showBarcode: false, showIngredients: true,
            showActiveSubstance: false, showPreparationTime: true, showDimensions: false, showSKU: false,
        },
        relevantUnits: ["por", "und", "L"],
        features: { hasTables: true, hasPrescriptions: false },
    },
    ferreteria: {
        view: "catalogo",
        label: "Ferretería",
        productLabel: "Producto",
        productFields: {
            showStock: true, showBarcode: true, showIngredients: false,
            showActiveSubstance: false, showPreparationTime: false, showDimensions: true, showSKU: true,
        },
        relevantUnits: ["pza", "und", "m", "cm", "kg"],
        features: { hasTables: false, hasPrescriptions: false },
    },
    tienda_ropa: {
        view: "catalogo",
        label: "Tienda de Ropa",
        productLabel: "Prenda",
        productFields: {
            showStock: true, showBarcode: true, showIngredients: false,
            showActiveSubstance: false, showPreparationTime: false, showDimensions: false, showSKU: true,
        },
        relevantUnits: ["pza", "und"],
        features: { hasTables: false, hasPrescriptions: false },
    },
    servicios: {
        view: "catalogo",
        label: "Servicios",
        productLabel: "Servicio",
        productFields: {
            showStock: false, showBarcode: false, showIngredients: false,
            showActiveSubstance: false, showPreparationTime: false, showDimensions: false, showSKU: false,
        },
        relevantUnits: ["hr", "ses", "día", "sem"],
        features: { hasTables: false, hasPrescriptions: false },
    },
    farmacia: {
        view: "catalogo",
        label: "Farmacia",
        productLabel: "Medicamento",
        productFields: {
            showStock: true, showBarcode: true, showIngredients: false,
            showActiveSubstance: true, showPreparationTime: false, showDimensions: false, showSKU: true,
        },
        relevantUnits: ["pza", "und", "g", "L"],
        features: { hasTables: false, hasPrescriptions: true },
    },
};

export function getIndustryConfig(type: string | undefined | null): IndustryConfig {
    return INDUSTRIES[(type as IndustryType) ?? "abarrotera"] ?? INDUSTRIES.abarrotera;
}

export function getPublicCatalogRoute(type: string | undefined | null): PublicCatalogRoute {
    const industry = getIndustryConfig(type);
    return industry.view === "menu" ? "menu" : "catalogo";
}
