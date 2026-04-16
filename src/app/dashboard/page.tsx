"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, ShoppingBag, Users, Activity, Loader2, MessageSquare, MessageCircle,
  CheckCircle2, Circle, ArrowRight, Smartphone, ChevronRight,
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { getIndustryConfig } from "@/config/industries";
import Link from "next/link";

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

// ─── Onboarding checklist ────────────────────────────────────────────────────

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    done: boolean;
    href: string;
    cta: string;
}

interface DayScheduleLike {
    open?: boolean;
    from_?: string;
    to?: string;
}

interface SettingsLike {
    name?: string;
    slug?: string;
    type?: string;
    hours?: Record<string, DayScheduleLike>;
    config?: {
        payment_methods?: unknown;
    };
}

function hasValidBusinessHours(hours: SettingsLike["hours"]): boolean {
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

function hasAtLeastOnePaymentMethod(config: SettingsLike["config"]): boolean {
    return Array.isArray(config?.payment_methods) && config.payment_methods.length > 0;
}

function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
    const completed = steps.filter((s) => s.done).length;
    const total = steps.length;
    const progress = Math.round((completed / total) * 100);

    return (
        <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground">
                                Configura tu negocio
                            </CardTitle>
                            <CardDescription className="mt-0.5 text-sm">
                                {completed} de {total} pasos completados
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-primary/20 text-primary font-semibold tabular-nums bg-primary/5"
                        >
                            {progress}%
                        </Badge>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                    step.done
                                        ? "border-border/40 bg-muted/30 opacity-55"
                                        : "border-border/60 bg-background hover:bg-muted/30"
                                }`}
                            >
                                <div className="shrink-0">
                                    {step.done ? (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground/30" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                        {step.title}
                                    </p>
                                    {!step.done && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                                    )}
                                </div>
                                {!step.done && (
                                    <Link href={step.href}>
                                        <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs h-7 rounded-lg border-border/60">
                                            {step.cta}
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
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
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
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

    const { data: settingsData, isLoading: settingsLoading } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.business.settings : null,
        fetcher
    );

    const { data: stats, isLoading: statsLoading } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.dashboard.stats : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    const { data: ordersData, isLoading: ordersLoading } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.orders.list : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    const { data: analyticsData } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.analytics.overview : null,
        fetcher,
        { refreshInterval: 30000 }
    );

    const settings = ((settingsData?.data || settingsData || {}) as SettingsLike);
    const businessType: string = settings.type || "abarrotera";
    const industryConfig = getIndustryConfig(businessType);
    const catalogLabel = industryConfig.view === "menu" ? "Menú" : "Catálogo";

    const recentOrders = (ordersData?.data || []) as RecentOrder[];
    const analytics = analyticsData?.data || analyticsData || {};
    const messageStats = analytics.messages || {};

    const hasName = Boolean(settings.name);
    const hasSlug = Boolean(settings.slug);
    const hasIndustry = Boolean(settings.type);
    const hasHours = hasValidBusinessHours(settings.hours);
    const hasPaymentMethods = hasAtLeastOnePaymentMethod(settings.config);
    const hasWhatsApp = Boolean(sessionBusinessPhoneId);
    const hasProducts = (stats?.active_products ?? 0) > 0;

    const onboardingSteps: OnboardingStep[] = [
        {
            id: "business",
            title: "Configura tu negocio",
            description: "Completa datos del negocio, horario, URL de catálogo y métodos de pago",
            done: hasName && hasSlug && hasIndustry && hasHours && hasPaymentMethods,
            href: "/dashboard/settings",
            cta: "Configurar",
        },
        {
            id: "catalog",
            title: `Sube tu ${catalogLabel.toLowerCase()}`,
            description: "Agrega al menos un producto para que el agente pueda responder sobre tu oferta",
            done: hasProducts,
            href: "/dashboard/products",
            cta: "Agregar",
        },
        {
            id: "whatsapp",
            title: "Conecta tu WhatsApp Business",
            description: "Vincula tu número para recibir mensajes y activar el inbox",
            done: hasWhatsApp,
            href: "/dashboard/settings?tab=conectar",
            cta: "Conectar",
        },
    ];

    const allOnboarded = onboardingSteps.every((s) => s.done);
    const isLoading = statsLoading || settingsLoading;

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

            {/* Onboarding — visible siempre hasta completar */}
            <AnimatePresence>
                {!allOnboarded && (
                    <OnboardingCard steps={onboardingSteps} />
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
                    {[
                        {
                            icon: Smartphone,
                            title: "Inbox y Pedidos",
                            desc: "Conecta tu WhatsApp Business para ver conversaciones y pedidos en tiempo real",
                            href: "/dashboard/settings",
                            cta: "Conectar WhatsApp",
                        },
                        {
                            icon: Package,
                            title: hasProducts ? `${stats?.active_products} productos cargados` : `Tu ${catalogLabel}`,
                            desc: hasProducts
                                ? "Tu catálogo está listo. Conecta WhatsApp para que el agente empiece a vender."
                                : `Empieza cargando tu ${catalogLabel.toLowerCase()} — puedes hacerlo antes de conectar WhatsApp`,
                            href: "/dashboard/products",
                            cta: hasProducts ? "Ver catálogo" : "Agregar productos",
                        },
                    ].map(({ icon: Icon, title, desc, href, cta }) => (
                        <Card key={href} className="rounded-2xl border-dashed border-border/60 shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                                <div className="p-3 rounded-2xl bg-muted/50">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{title}</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">{desc}</p>
                                </div>
                                <Link href={href}>
                                    <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl border-border/60">
                                        {cta}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
