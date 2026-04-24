/**
 * Single source of truth for onboarding completion (dashboard + sidebar).
 * Flujo en producto: selección de categoría → selección de industria →
 * datos mínimos (nombre) → configuración de entrega/cobertura → Conectar WhatsApp.
 * Horarios y slug no son obligatorios para desbloquear pasos.
 */

export interface DayScheduleLike {
    open?: boolean;
    from_?: string;
    to?: string;
}

export interface OnboardingSettingsLike {
    name?: string;
    slug?: string;
    type?: string;
    business_category?: string;
    delivery_mode?: string;
    hours?: Record<string, DayScheduleLike>;
    config?: {
        payment_methods?: unknown;
        signup_completed?: boolean;
    };
}

/** Industrias disponibles por business_category (alineado con TIPOS-NEGOCIOS.md).
 *  `icon` corresponde a un nombre de icono Lucide (se resuelve en DashboardOnboarding). */
export const INDUSTRIES_BY_CATEGORY: Record<string, ReadonlyArray<{ slug: string; label: string; icon: string }>> = {
    restaurant: [
        { slug: "restaurante",  label: "Restaurante",                icon: "UtensilsCrossed" },
        { slug: "cafeteria",    label: "Cafetería / Panadería",      icon: "Coffee" },
        { slug: "comida_rapida", label: "Comida rápida / Tacos / Pizza", icon: "ChefHat" },
    ],
    physical_store: [
        { slug: "abarrotera",  label: "Abarrotes / Miscelánea", icon: "ShoppingCart" },
        { slug: "ferreteria",  label: "Ferretería / Materiales", icon: "Wrench" },
        { slug: "farmacia",    label: "Farmacia",                icon: "Pill" },
        { slug: "tienda_ropa", label: "Ropa y accesorios",       icon: "ShoppingBag" },
    ],
    online_store: [
        { slug: "tienda_online", label: "Tienda en línea / E-commerce", icon: "Package" },
        { slug: "tienda_ropa",   label: "Ropa y accesorios",            icon: "ShoppingBag" },
    ],
    field_service: [
        { slug: "servicios",   label: "Servicios generales",    icon: "Wrench" },
        { slug: "belleza",     label: "Salón de belleza / Spa", icon: "Scissors" },
        { slug: "medico",      label: "Consultorio médico",     icon: "Stethoscope" },
    ],
    digital_service: [
        { slug: "tienda_digital", label: "Productos o servicios digitales", icon: "Globe" },
    ],
};

export function hasValidBusinessHours(hours: OnboardingSettingsLike["hours"]): boolean {
    if (!hours || typeof hours !== "object") {
        return false;
    }
    return Object.values(hours).some((day) => {
        if (!day?.open) {
            return false;
        }
        return Boolean(day.from_?.trim() && day.to?.trim());
    });
}

export function hasAtLeastOnePaymentMethod(config: OnboardingSettingsLike["config"]): boolean {
    return Array.isArray(config?.payment_methods) && config.payment_methods.length > 0;
}

export interface OnboardingComputationInput {
    settings: OnboardingSettingsLike;
    activeProducts: number;
    hasWhatsAppConnected: boolean;
}

export interface OnboardingState {
    hasIndustry: boolean;
    hasCategory: boolean;
    /** Solo requiere nombre (horarios ya no son obligatorios). */
    hasBusinessProfile: boolean;
    /** Solo informativo / métricas; ya no bloquea pasos. */
    hasCatalogContent: boolean;
    /** True si el modo de entrega ya fue configurado (o la categoría no lo requiere). */
    hasDeliveryConfig: boolean;
    hasWhatsApp: boolean;
    /** Categoría + industria listos — habilita el paso de datos del negocio. */
    hasIndustrySelected: boolean;
    /** Categoría + industria + nombre + entrega listos — habilita la pestaña Conectar WhatsApp. */
    canStartWhatsApp: boolean;
    /** Categoría + industria + nombre + entrega + WhatsApp — onboarding terminado. */
    allComplete: boolean;
}

export function computeOnboardingState(input: OnboardingComputationInput): OnboardingState {
    const { settings, activeProducts, hasWhatsAppConnected } = input;
    const hasIndustry = Boolean(settings.type?.trim());
    const hasCategory = Boolean(settings.business_category?.trim());
    const hasName = Boolean(settings.name?.trim());
    const hasBusinessProfile = hasName;
    const hasCatalogContent = hasIndustry && activeProducts > 0;
    // Fuente de verdad: estado de conexión desde backend (whatsapp-signup/status)
    const hasWhatsApp = hasWhatsAppConnected;

    // digital_service no necesita configurar entrega — se considera completado automáticamente
    const hasDeliveryConfig =
        settings.business_category === "digital_service"
            ? true
            : Boolean(settings.delivery_mode?.trim());

    // Paso 0 (categoría) + paso 1 (industria) completados
    const hasIndustrySelected = hasCategory && hasIndustry;

    const canStartWhatsApp = hasName && hasCategory && hasIndustry && hasDeliveryConfig;
    const allComplete = canStartWhatsApp && hasWhatsApp;

    return {
        hasIndustry,
        hasCategory,
        hasIndustrySelected,
        hasBusinessProfile,
        hasCatalogContent,
        hasDeliveryConfig,
        hasWhatsApp,
        canStartWhatsApp,
        allComplete,
    };
}
