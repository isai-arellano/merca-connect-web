/**
 * Tipos compartidos para el flujo de registro y onboarding (Fase 9).
 * Espejo de app/schemas/registration.py en el backend.
 */

export type BusinessType = "restaurant" | "store" | "service" | "store_service";
export type SellMode = "delivery" | "pickup" | "digital" | "info_only";
export type SellType = "physical" | "service" | "both" | "digital";

export interface Industry {
    id: string;
    label: string;
    icon: string;
    businessType: BusinessType;
    isCustom?: boolean;
}

// Industrias disponibles en el Paso 3
export const INDUSTRIES: Industry[] = [
    { id: "restaurant", label: "Restaurante / Comida", icon: "🍽️", businessType: "restaurant" },
    { id: "cafe", label: "Cafetería / Bebidas", icon: "☕", businessType: "restaurant" },
    { id: "store", label: "Tienda / Abarrotes", icon: "🛍️", businessType: "store" },
    { id: "fashion", label: "Moda y Belleza", icon: "👗", businessType: "store" },
    { id: "tech", label: "Tecnología / Electrónica", icon: "💻", businessType: "store" },
    { id: "home", label: "Hogar y Decoración", icon: "🏠", businessType: "store" },
    { id: "spa", label: "Spa / Bienestar", icon: "💆", businessType: "service" },
    { id: "services", label: "Servicios Profesionales", icon: "🔧", businessType: "service" },
    { id: "auto", label: "Automotriz", icon: "🚗", businessType: "store_service" },
    { id: "other", label: "Otro", icon: "✏️", businessType: "store", isCustom: true },
];

export const SELL_MODE_LABELS: Record<SellMode, string> = {
    delivery: "A domicilio / Delivery",
    pickup: "En mi local / Pickup",
    digital: "En línea / Digital",
    info_only: "Solo información (no vendo directo aún)",
};

export const SELL_TYPE_LABELS: Record<SellType, string> = {
    physical: "Productos físicos",
    service: "Servicios",
    both: "Productos y servicios",
    digital: "Productos digitales",
};

// Estado completo del formulario de registro (todos los pasos)
export interface RegisterFormState {
    // Paso 1
    name: string;
    email: string;
    password: string;
    emailVerified: boolean;

    // Paso 2
    businessName: string;
    slug: string;

    // Paso 3
    selectedIndustry: Industry | null;
    customIndustry: string;

    // Paso 4
    sellModes: SellMode[];
    sellType: SellType | null;

    // Paso 5
    phone: string;
    catalogPublic: boolean;
}

export const INITIAL_FORM_STATE: RegisterFormState = {
    name: "",
    email: "",
    password: "",
    emailVerified: false,
    businessName: "",
    slug: "",
    selectedIndustry: null,
    customIndustry: "",
    sellModes: [],
    sellType: null,
    phone: "",
    catalogPublic: true,
};
