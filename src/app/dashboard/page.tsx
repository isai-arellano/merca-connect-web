"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingBag, Users, Activity, Loader2, MessageSquare, MessageCircle,
  ArrowRight, Smartphone, AlertTriangle,
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { getIndustryConfig } from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";
import Link from "next/link";
import { type ApiList, type AnalyticsOverview, type BusinessSettings, type DashboardStats, type PlanUsage } from "@/types/api";
import { computeOnboardingState } from "@/lib/onboarding";
import { DashboardOnboarding } from "@/components/onboarding/DashboardOnboarding";

interface RecentOrder {
    id: string;
    total: string | number;
    status: string;
    items?: Array<unknown>;
}

function toFiniteNumber(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: string | number | null | undefined): string {
    return toFiniteNumber(value).toFixed(2);
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 22 } },
};

interface SettingsLike {
    name?: string;
    slug?: string;
    type?: string;
    hours?: Record<string, { open?: boolean; from_?: string; to?: string }>;
    config?: {
        payment_methods?: unknown;
    };
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
}: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-sm border-border/60 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-xl bg-brand-mint/80">
                            <Icon className="h-4 w-4 text-brand-forest" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
                    <p className="text-xs font-medium text-muted-foreground/80 mt-0.5">{title}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{subtitle}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { data: session } = useSession();
    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

    const { data: settingsData, isLoading: settingsLoading } = useSWR<BusinessSettings | { data: BusinessSettings } | SettingsLike | { data: SettingsLike }>(
        session ? endpoints.business.settings : null,
        fetcher
    );

    const { data: statsRaw, isLoading: statsLoading } = useSWR<DashboardStats>(
        session && sessionBusinessPhoneId ? endpoints.dashboard.stats : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    const stats: DashboardStats | undefined = statsRaw;

    const { data: ordersData, isLoading: ordersLoading } = useSWR<ApiList<RecentOrder>>(
        session && sessionBusinessPhoneId ? endpoints.orders.list : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    const { data: analyticsData } = useSWR<AnalyticsOverview | { data: AnalyticsOverview }>(
        session && sessionBusinessPhoneId ? endpoints.analytics.overview : null,
        fetcher,
        { refreshInterval: 30000 }
    );

    const { data: planRaw } = useSWR<PlanUsage | { data: PlanUsage }>(
        session && sessionBusinessPhoneId ? endpoints.business.planUsage : null,
        fetcher,
        { refreshInterval: 60000 }
    );

    const settings: SettingsLike =
        (settingsData as { data: BusinessSettings } | null)?.data ??
        (settingsData as BusinessSettings | null) ??
        {};
    const { industriesMap } = useIndustries();
    const businessType: string = settings.type || "abarrotera";
    const industryConfig = getIndustryConfig(businessType, industriesMap);
    const catalogLabel = industryConfig.view === "menu" ? "Menú" : "Catálogo";

    const recentOrders: RecentOrder[] = ordersData?.data ?? [];
    const analytics: AnalyticsOverview =
        (analyticsData as { data: AnalyticsOverview } | null)?.data ??
        (analyticsData as AnalyticsOverview | null) ??
        {};
    const messageStats = analytics.messages || {};

    const hasWhatsApp = Boolean(sessionBusinessPhoneId);
    const hasProducts = (stats?.active_products ?? 0) > 0;

    const onboardingState = computeOnboardingState({
        settings,
        activeProducts: stats?.active_products ?? 0,
        hasWhatsAppSession: hasWhatsApp,
    });

    const allOnboarded = onboardingState.allComplete;
    const hasIndustry = onboardingState.hasIndustry;
    const isLoading = statsLoading || settingsLoading;

    const planUsage: PlanUsage | null =
        (planRaw as { data: PlanUsage } | null)?.data ??
        (planRaw as PlanUsage | null) ??
        null;

    return (
        <motion.div
            className="space-y-6 max-w-6xl"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {allOnboarded ? "Tablero General" : `Hola${settings.name ? `, ${settings.name}` : ""} 👋`}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {allOnboarded
                        ? "Aquí tienes un resumen de la actividad de tu negocio."
                        : "Completa los pasos a continuación para activar todas las funciones."}
                </p>
            </motion.div>

            {/* Quota warning banner */}
            {allOnboarded && planUsage?.near_limit && (
                <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                            Has usado el {Math.round((planUsage.conversations_used / planUsage.conversations_limit) * 100)}% de tus conversaciones este mes.{" "}
                            <Link href="/dashboard/settings?tab=plan" className="underline font-medium">
                                Ver plan
                            </Link>
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Onboarding — visible siempre hasta completar */}
            <AnimatePresence>
                {!allOnboarded && (
                    <DashboardOnboarding
                        settings={settings as BusinessSettings}
                        onboarding={onboardingState}
                        catalogLabel={catalogLabel}
                        businessType={businessType}
                    />
                )}
            </AnimatePresence>

            {/* Métricas */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Pedidos Totales"
                        value={stats?.total_orders || 0}
                        subtitle={`${stats?.new_orders || 0} pendientes`}
                        icon={ShoppingBag}
                    />
                    <MetricCard
                        title="Ingresos Estimados"
                        value={`$${(stats?.estimated_revenue || 0).toFixed(2)}`}
                        subtitle="Pedidos listos y entregados"
                        icon={Activity}
                    />
                    <MetricCard
                        title={`${catalogLabel} activo`}
                        value={stats?.active_products || 0}
                        subtitle={hasProducts ? `${industryConfig.productLabel.toLowerCase()}s visibles` : "Sin productos aún"}
                        icon={Package}
                    />
                    <MetricCard
                        title="Clientes"
                        value={stats?.total_customers || 0}
                        subtitle={hasWhatsApp ? "Vía WhatsApp" : "Conecta WhatsApp primero"}
                        icon={Users}
                    />
                </motion.div>
            )}

            {/* Contenido secundario */}
            {hasWhatsApp ? (
                <motion.div className="grid gap-4 lg:grid-cols-7" variants={itemVariants}>
                    {/* Mensajes */}
                    <Card className="lg:col-span-4 rounded-2xl shadow-sm border-border/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Resumen de Mensajes</CardTitle>
                            <CardDescription>Actividad de conversaciones</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Enviados hoy</p>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{messageStats.sent_today ?? 0}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Recibidos hoy</p>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{messageStats.received_today ?? 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 text-sm">
                                {[
                                    ["Esta semana env.", messageStats.sent_this_week ?? 0],
                                    ["Esta semana rec.", messageStats.received_this_week ?? 0],
                                    ["Este mes env.", messageStats.sent_this_month ?? 0],
                                    ["Este mes rec.", messageStats.received_this_month ?? 0],
                                ].map(([label, val]) => (
                                    <div key={String(label)} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                                        <span className="text-xs text-muted-foreground">{label}</span>
                                        <span className="text-xs font-semibold tabular-nums">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Últimos pedidos */}
                    <Card className="lg:col-span-3 rounded-2xl shadow-sm border-border/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Últimos Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ordersLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                                            <div>
                                                <span className="text-xs font-semibold text-foreground">
                                                    #{order.id.split("-")[0].toUpperCase()}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ${formatCurrency(order.total)}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                order.status === "entregado" ? "bg-emerald-100 text-emerald-700" :
                                                order.status === "pendiente" ? "bg-amber-100 text-amber-700" :
                                                order.status === "cancelado" ? "bg-red-100 text-red-700" :
                                                "bg-muted text-muted-foreground"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            No hay pedidos recientes.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                /* Estado vacío sin WhatsApp */
                <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                    <Card className="rounded-2xl border-dashed border-border/60 shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <div className="p-3 rounded-2xl bg-brand-mint/80">
                                <Smartphone className="h-5 w-5 text-brand-forest" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Inbox y Pedidos</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
                                    {onboardingState.canStartWhatsApp
                                        ? "Conecta tu WhatsApp Business para ver conversaciones y pedidos en tiempo real."
                                        : "Completa tipo de negocio y nombre con horario (pasos 1 y 2) para habilitar WhatsApp."}
                                </p>
                            </div>
                            {onboardingState.canStartWhatsApp ? (
                                <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl border-brand-forest/30 text-brand-forest" asChild>
                                    <Link href="/dashboard/settings?tab=conectar">
                                        Conectar WhatsApp
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button size="sm" variant="outline" disabled className="gap-2 text-xs rounded-xl opacity-60">
                                    Conectar WhatsApp
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-dashed border-border/60 shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <div className="p-3 rounded-2xl bg-brand-mint/80">
                                <Package className="h-5 w-5 text-brand-forest" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    {hasProducts ? `${stats?.active_products} productos cargados` : `Tu ${catalogLabel}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
                                    {hasProducts
                                        ? "Tu catálogo está listo. Conecta WhatsApp para que el agente empiece a vender."
                                        : hasIndustry
                                          ? `Empieza cargando tu ${catalogLabel.toLowerCase()} desde el tablero.`
                                          : "Primero elige tu tipo de negocio en el asistente de arriba."}
                                </p>
                            </div>
                            {hasIndustry ? (
                                <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl border-brand-forest/30 text-brand-forest" asChild>
                                    <Link href="/dashboard/products">
                                        {hasProducts ? "Ver catálogo" : "Agregar productos"}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl border-brand-forest/30 text-brand-forest" asChild>
                                    <Link href="/dashboard">
                                        Ir al tablero
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
