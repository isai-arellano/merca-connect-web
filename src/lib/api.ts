/**
 * URL del API en el **navegador** (panel, SWR, etc.). En desarrollo local, usa el API
 * en tu máquina para evitar CORS y depurar sin depender del entorno remoto:
 * `NEXT_PUBLIC_API_URL=http://localhost:8001` en `.env.local`.
 * Si apuntas a dev/prod (`https://dev-api…`) desde `http://localhost:3000`, el servidor
 * remoto debe incluir `http://localhost:3000` (y `http://127.0.0.1:3000`) en
 * `CORS_ALLOWED_ORIGINS`; un **500** sin respuesta CORS suele mostrarse en consola como error de CORS.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
export const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "local-dev";

/**
 * URL base del API para fetch en el servidor (páginas públicas de catálogo/menú).
 * En Docker u otros despliegues, el servidor Next puede necesitar un host distinto al del navegador.
 * Prioridad: API_URL (solo servidor) → NEXT_PUBLIC_API_URL → localhost.
 */
export function getServerApiBaseUrl(): string {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
}

export const endpoints = {
    auth: {
        login: `${API_URL}/api/v1/auth/login`,
        changePassword: `${API_URL}/api/v1/auth/change-password`,
    },
    categories: {
        list: `${API_URL}/api/v1/categories`,
        create: `${API_URL}/api/v1/categories`,
        delete: (id: string) => `${API_URL}/api/v1/categories/${id}`,
    },
    catalog: {
        public: (slug: string) => `${API_URL}/api/v1/catalog/${encodeURIComponent(slug)}`,
    },
    admin: {
        provision: `${API_URL}/api/v1/admin/provision`,
        businesses: `${API_URL}/api/v1/admin/businesses`,
        industries: `${API_URL}/api/v1/admin/industries`,
        industry: (slug: string) =>
            `${API_URL}/api/v1/admin/industries/${encodeURIComponent(slug)}`,
        planDefinitions: `${API_URL}/api/v1/admin/plan-definitions`,
        planDefinition: (planKey: string) =>
            `${API_URL}/api/v1/admin/plan-definitions/${encodeURIComponent(planKey)}`,
    },
    products: {
        list: (includeInactive = false) =>
            includeInactive
                ? `${API_URL}/api/v1/products?include_inactive=true`
                : `${API_URL}/api/v1/products`,
        detail: (id: string) => `${API_URL}/api/v1/products/${id}`,
        disable: (id: string) => `${API_URL}/api/v1/products/${id}`,
        hardDelete: (id: string) => `${API_URL}/api/v1/products/${id}/permanent`,
        uploadImage: (id: string) => `${API_URL}/api/v1/products/${id}/image`,
        /** Misma ruta: PUT reemplaza, DELETE quita. */
        productImageAtIndex: (id: string, imageIndex: number) =>
            `${API_URL}/api/v1/products/${id}/image/${imageIndex}`,
        deleteImage: (id: string, imageIndex: number) =>
            `${API_URL}/api/v1/products/${id}/image/${imageIndex}`,
    },
    units: {
        list: `${API_URL}/api/v1/units`,
        create: `${API_URL}/api/v1/units`,
        delete: (id: string) => `${API_URL}/api/v1/units/${id}`,
    },
    dashboard: {
        stats: `${API_URL}/api/v1/dashboard/stats`,
    },
    orders: {
        list: `${API_URL}/api/v1/orders`,
        detail: (id: string) => `${API_URL}/api/v1/orders/${id}`,
        updateStatus: (id: string) => `${API_URL}/api/v1/orders/${id}/status`,
    },
    customers: {
        list: `${API_URL}/api/v1/customers`,
        detail: (phoneNumber: string) => `${API_URL}/api/v1/customers/${phoneNumber}`,
        update: (phoneNumber: string) => `${API_URL}/api/v1/customers/${phoneNumber}`,
    },
    conversations: {
        list: `${API_URL}/api/v1/conversations`,
        detail: (id: string) => `${API_URL}/api/v1/conversations/${id}`,
        reply: (id: string) => `${API_URL}/api/v1/conversations/${id}/reply`,
        handoff: (id: string) => `${API_URL}/api/v1/conversations/${id}/handoff`,
        paymentCard: (id: string) => `${API_URL}/api/v1/conversations/${id}/payment-card`,
        handoffNotifications: `${API_URL}/api/v1/conversations/notifications/handoffs`,
    },
    templates: {
        list: `${API_URL}/api/v1/templates`,
        create: `${API_URL}/api/v1/templates`,
        send: `${API_URL}/api/v1/templates/send`,
        preview: (name: string) => `${API_URL}/api/v1/templates/${name}/preview`,
    },
    analytics: {
        overview: `${API_URL}/api/v1/analytics/overview`,
    },
    media: {
        get: (mediaId: string) => `${API_URL}/api/v1/media/${mediaId}`,
    },
    business: {
        settings: `${API_URL}/api/v1/business/settings`,
        logoUpload: `${API_URL}/api/v1/business/logo`,
        bannerUpload: `${API_URL}/api/v1/business/banner`,
        whatsappProfile: `${API_URL}/api/v1/business/whatsapp-profile`,
        agentToggle: `${API_URL}/api/v1/business/agent-toggle`,
        whatsappSignupComplete: `${API_URL}/api/v1/business/whatsapp-signup/complete`,
        whatsappSignupStatus: `${API_URL}/api/v1/business/whatsapp-signup/status`,
        whatsappDisconnect: `${API_URL}/api/v1/business/whatsapp-signup/disconnect`,
        planUsage: `${API_URL}/api/v1/business/plan/usage`,
        planAllowExtra: `${API_URL}/api/v1/business/plan/allow-extra`,
    },
    paymentTemplates: {
        list: `${API_URL}/api/v1/payment-templates`,
        create: `${API_URL}/api/v1/payment-templates`,
        update: (id: string) => `${API_URL}/api/v1/payment-templates/${id}`,
        delete: (id: string) => `${API_URL}/api/v1/payment-templates/${id}`,
    },
    industries: {
        /** Mismo payload que /api/v1/industries; va bajo catalog para convivir con despliegues/proxies. */
        list: `${API_URL}/api/v1/catalog/industries`,
    },
    agents: {
        config: (businessId: string) => `${API_URL}/api/v1/agents?business_id=${businessId}`,
    },
    knowledge: {
        list: (businessId: string) => `${API_URL}/api/v1/knowledge?business_id=${businessId}`,
        create: `${API_URL}/api/v1/knowledge`,
        update: (id: string) => `${API_URL}/api/v1/knowledge/${id}`,
        delete: (id: string) => `${API_URL}/api/v1/knowledge/${id}`,
    },
};
