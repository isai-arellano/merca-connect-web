// ── Wrapper genérico (el backend envuelve listas en { data: [...] }) ──
export interface ApiList<T> {
    data: T[];
}

// ── Business / Settings ──
export interface Business {
    id: string;
    name: string;
    phone_number: string | null;
    signup_completed: boolean;
}

export interface ProvisionResult {
    business_id: string;
    email: string;
}

export interface DaySchedule {
    open?: boolean;
    hours?: string;
}

export interface BusinessConfig {
    payment_methods?: string[];
    delivery_zone?: string | null;
    catalog_logo_url?: string | null;
    [key: string]: unknown;
}

export interface PaymentTemplate {
    id: string;
    name: string;
    method?: string | null;
    content: string;
    is_active: boolean;
}

export interface BusinessSettings {
    name?: string;
    slug?: string;
    type?: string;
    address?: string;
    phone?: string;
    description?: string;
    hours?: Record<string, DaySchedule>;
    config?: BusinessConfig;
}

// ── Dashboard Stats ──
export interface DashboardStats {
    total_orders: number;
    new_orders: number;
    estimated_revenue: number;
    active_products: number;
    total_customers: number;
}

// ── Analytics ──
export interface MessagesByDay {
    label: string;
    sent: number;
    received: number;
}

export interface AnalyticsOverview {
    messages?: {
        sent_today?: number;
        received_today?: number;
        sent_this_week?: number;
        received_this_week?: number;
        sent_this_month?: number;
        received_this_month?: number;
    };
    orders_by_status?: Record<string, number | null>;
    messages_sent_today?: number;
    messages_received_today?: number;
    active_conversations?: number;
    orders_pending?: number;
    avg_response_time_seconds?: number | null;
    min_response_time_seconds?: number | null;
    max_response_time_seconds?: number | null;
    messages_by_day?: MessagesByDay[];
    [key: string]: unknown;
}

// ── Orders ──
export interface OrderCustomer {
    name?: string;
    phone?: string;
    phone_number?: string;
}

export interface OrderItem {
    id?: string;
    name?: string;
    quantity?: number;
    price?: number;
    subtotal?: number;
}

export interface Order {
    id: string;
    status: string;
    total: number;
    delivery_address?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
    customer?: OrderCustomer;
}

// ── Conversations ──
export interface ConversationMessage {
    id: string;
    direction: "inbound" | "outbound";
    content?: string;
    message_type?: string;
    media_id?: string | null;
    media_mime_type?: string;
    created_at: string;
}

export interface ConversationCustomer {
    id?: string;
    name?: string;
    phone?: string;
    phone_number?: string;
    avatar_url?: string;
}

export interface ConversationSummary {
    id: string;
    status: string;
    handoff_source?: "agent" | "operator" | null;
    agent_enabled?: boolean;
    updated_at?: string;
    customer?: ConversationCustomer;
    last_message?: ConversationMessage;
    messages?: ConversationMessage[];
}

export interface ConversationDetail {
    id: string;
    status: string;
    agent_enabled?: boolean;
    customer?: ConversationCustomer;
    messages: ConversationMessage[];
}

// ── Templates ──
export interface TemplateComponent {
    type?: string;
    text?: string;
    [key: string]: unknown;
}

export interface MessageTemplate {
    id?: string;
    name: string;
    status?: string;
    category?: string;
    language?: string;
    body?: string;
    components?: TemplateComponent[];
}

// ── Knowledge ──
export interface KnowledgeDoc {
    id: string;
    business_id: string;
    title: string;
    content: string;
    doc_type: string;
    is_active: boolean;
    created_at: string;
}

// ── Products ──
export interface CategoryOption {
    id: string;
    name: string;
}

export interface UnitOption {
    id: string;
    name: string;
    symbol: string;
    is_system: boolean;
}

// ── WhatsApp ──
export interface SignupStatus {
    connected: boolean;
    waba_id?: string;
    display_phone?: string;
    phone_number?: string;
    meta_app_id?: string;
}

// ── Customers ──
export interface Customer {
    id: string;
    name?: string;
    phone?: string;
    phone_number?: string;
    email?: string;
    tags?: string[];
    notes?: string;
    created_at?: string;
}

// ── WhatsApp Profile ──
export interface WhatsAppProfile {
    verified_name?: string;
    category?: string;
    about?: string;
    address?: string;
    description?: string;
    websites?: string[] | string;
    profile_picture_url?: string;
    [key: string]: unknown;
}
