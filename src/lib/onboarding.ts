/**
 * Single source of truth for onboarding completion (dashboard + sidebar).
 * Tres pasos: industria → nombre + horarios válidos → WhatsApp.
 * Sin requisito de slug, métodos de pago ni productos en catálogo para avanzar.
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
    hours?: Record<string, DayScheduleLike>;
    config?: {
        payment_methods?: unknown;
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
    /** Nombre + horarios válidos (sin slug ni pagos obligatorios). */
    hasBusinessProfile: boolean;
    /** Solo informativo / métricas; ya no bloquea pasos. */
    hasCatalogContent: boolean;
    hasWhatsApp: boolean;
    /** Pasos 1–2 listos — habilita conectar WhatsApp (paso 3). */
    canStartWhatsApp: boolean;
    /** Industria + perfil básico + WhatsApp — onboarding terminado. */
    allComplete: boolean;
}

export function computeOnboardingState(input: OnboardingComputationInput): OnboardingState {
    const { settings, activeProducts, hasWhatsAppSession } = input;
    const hasIndustry = Boolean(settings.type?.trim());
    const hasName = Boolean(settings.name?.trim());
    const hasHours = hasValidBusinessHours(settings.hours);
    const hasBusinessProfile = hasName && hasHours;
    const hasCatalogContent = hasIndustry && activeProducts > 0;
    const hasWhatsApp = hasWhatsAppSession;
    const canStartWhatsApp = hasIndustry && hasBusinessProfile;
    const allComplete = hasIndustry && hasBusinessProfile && hasWhatsApp;

    return {
        hasIndustry,
        hasBusinessProfile,
        hasCatalogContent,
        hasWhatsApp,
        canStartWhatsApp,
        allComplete,
    };
}
