/**
 * Single source of truth for onboarding completion (dashboard + sidebar).
 * Flujo en producto: selección de categoría de negocio → datos mínimos (nombre) →
 * configuración de entrega/cobertura → Conectar WhatsApp.
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
    hasWhatsAppSession: boolean;
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
    /** Categoría + nombre + entrega listos — habilita la pestaña Conectar WhatsApp. */
    canStartWhatsApp: boolean;
    /** Categoría + nombre + entrega + WhatsApp — onboarding terminado. */
    allComplete: boolean;
}

export function computeOnboardingState(input: OnboardingComputationInput): OnboardingState {
    const { settings, activeProducts, hasWhatsAppSession } = input;
    const hasIndustry = Boolean(settings.type?.trim());
    const hasCategory = Boolean(settings.business_category?.trim());
    const hasName = Boolean(settings.name?.trim());
    const hasBusinessProfile = hasName;
    const hasCatalogContent = hasIndustry && activeProducts > 0;
    // Fuente de verdad: signup_completed en DB (via settings), no el JWT de sesión
    const hasWhatsApp = Boolean(settings.config?.signup_completed) || hasWhatsAppSession;

    // digital_service no necesita configurar entrega — se considera completado automáticamente
    const hasDeliveryConfig =
        settings.business_category === "digital_service"
            ? true
            : Boolean(settings.delivery_mode?.trim());

    const canStartWhatsApp = hasName && hasCategory && hasDeliveryConfig;
    const allComplete = hasCategory && hasName && hasDeliveryConfig && hasWhatsApp;

    return {
        hasIndustry,
        hasCategory,
        hasBusinessProfile,
        hasCatalogContent,
        hasDeliveryConfig,
        hasWhatsApp,
        canStartWhatsApp,
        allComplete,
    };
}
