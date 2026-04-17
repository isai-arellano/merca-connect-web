export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function withBusinessPhoneId(path: string, businessPhoneId?: string | null) {
    if (!businessPhoneId) {
        return path;
    }

    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}business_phone_id=${encodeURIComponent(businessPhoneId)}`;
}

export const endpoints = {
    auth: {
        login: `${API_URL}/api/v1/auth/login`,
    },
    categories: {
        list: (businessPhoneId: string) => withBusinessPhoneId(`${API_URL}/api/v1/categories`, businessPhoneId),
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
    },
    products: {
        list: (businessPhoneId: string, includeInactive = false) => withBusinessPhoneId(`${API_URL}/api/v1/products${includeInactive ? "?include_inactive=true" : ""}`, businessPhoneId),
        detail: (id: string, businessPhoneId?: string | null) => withBusinessPhoneId(`${API_URL}/api/v1/products/${id}`, businessPhoneId),
        disable: (id: string) => `${API_URL}/api/v1/products/${id}`,
        hardDelete: (id: string) => `${API_URL}/api/v1/products/${id}/permanent`,
        uploadImage: (id: string) => `${API_URL}/api/v1/products/${id}/image`,
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
        whatsappProfile: `${API_URL}/api/v1/business/whatsapp-profile`,
        agentToggle: `${API_URL}/api/v1/business/agent-toggle`,
        whatsappSignupComplete: `${API_URL}/api/v1/business/whatsapp-signup/complete`,
        whatsappSignupStatus: `${API_URL}/api/v1/business/whatsapp-signup/status`,
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
