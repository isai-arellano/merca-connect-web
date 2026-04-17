/**
 * Single source of truth for onboarding completion (dashboard + sidebar).
 * Mirrors validation rules previously inlined in dashboard/page.tsx.
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
    hasBusinessProfile: boolean;
    hasCatalogContent: boolean;
    hasWhatsApp: boolean;
    /** Steps 1–3 complete — enables WhatsApp connect CTA */
    canStartWhatsApp: boolean;
    /** All four steps complete — unlocks Settings in sidebar */
    allComplete: boolean;
}

export function computeOnboardingState(input: OnboardingComputationInput): OnboardingState {
    const { settings, activeProducts, hasWhatsAppSession } = input;
    const hasIndustry = Boolean(settings.type?.trim());
    const hasName = Boolean(settings.name?.trim());
    const hasSlug = Boolean(settings.slug?.trim());
    const hasHours = hasValidBusinessHours(settings.hours);
    const hasPaymentMethods = hasAtLeastOnePaymentMethod(settings.config);
    const hasBusinessProfile = hasName && hasSlug && hasHours && hasPaymentMethods;
    const hasCatalogContent = hasIndustry && activeProducts > 0;
    const hasWhatsApp = hasWhatsAppSession;
    const canStartWhatsApp = hasIndustry && hasBusinessProfile && hasCatalogContent;
    const allComplete = hasIndustry && hasBusinessProfile && hasCatalogContent && hasWhatsApp;

    return {
        hasIndustry,
        hasBusinessProfile,
        hasCatalogContent,
        hasWhatsApp,
        canStartWhatsApp,
        allComplete,
    };
}
