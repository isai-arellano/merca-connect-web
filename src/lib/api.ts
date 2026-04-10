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
    products: {
        list: (businessPhoneId: string) => withBusinessPhoneId(`${API_URL}/api/v1/products`, businessPhoneId),
        detail: (id: string, businessPhoneId?: string | null) => withBusinessPhoneId(`${API_URL}/api/v1/products/${id}`, businessPhoneId),
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
        detail: (id: string) => `${API_URL}/api/v1/customers/${id}`,
    },
    conversations: {
        list: `${API_URL}/api/v1/conversations`,
        detail: (id: string) => `${API_URL}/api/v1/conversations/${id}`,
        reply: (id: string) => `${API_URL}/api/v1/conversations/${id}/reply`,
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
        whatsappProfile: `${API_URL}/api/v1/business/whatsapp-profile`,
        agentToggle: `${API_URL}/api/v1/business/agent-toggle`,
    },
    agents: {
        config: (businessId: string) => `${process.env.NEXT_PUBLIC_AGENTS_URL || "http://localhost:8002"}/api/v1/agents?business_id=${businessId}`,
    },
};
