export type IndustryType = "abarrotera" | "restaurante" | "farmacia";

export interface IndustryConfig {
    productFields: {
        showStock: boolean;
        showBarcode: boolean;
        showIngredients: boolean;
        showActiveSubstance: boolean;
        showPreparationTime: boolean;
    };
    features: {
        hasTables: boolean;
        hasPrescriptions: boolean;
    };
}

export const INDUSTRIES: Record<IndustryType, IndustryConfig> = {
    abarrotera: {
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: false,
            showPreparationTime: false,
        },
        features: {
            hasTables: false,
            hasPrescriptions: false,
        },
    },
    restaurante: {
        productFields: {
            showStock: false,
            showBarcode: false,
            showIngredients: true,
            showActiveSubstance: false,
            showPreparationTime: true,
        },
        features: {
            hasTables: true,
            hasPrescriptions: false,
        },
    },
    farmacia: {
        productFields: {
            showStock: true,
            showBarcode: true,
            showIngredients: false,
            showActiveSubstance: true,
            showPreparationTime: false,
        },
        features: {
            hasTables: false,
            hasPrescriptions: true,
        },
    }
};
