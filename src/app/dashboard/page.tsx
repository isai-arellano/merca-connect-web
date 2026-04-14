"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, ShoppingBag, Users, Activity, Loader2, MessageSquare, MessageCircle,
  CheckCircle2, Circle, ArrowRight, Settings, Smartphone, ChevronRight,
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
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
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

function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
    const completed = steps.filter((s) => s.done).length;
    const total = steps.length;
    const progress = Math.round((completed / total) * 100);
    const allDone = completed === total;

    if (allDone) return null;

    return (
        <motion.div variants={itemVariants}>
            <Card className="border-[#74E79C]/30 bg-gradient-to-br from-[#74E79C]/5 to-transparent">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Configura tu negocio</CardTitle>
                            <CardDescription className="mt-1">
                                {completed} de {total} pasos completados — completa la configuración para activar todas las funciones
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-[#74E79C]/40 text-[#74E79C] font-semibold tabular-nums"
                        >
                            {progress}%
                        </Badge>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-[#74E79C]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    step.done
                                        ? "border-[#74E79C]/20 bg-[#74E79C]/5 opacity-60"
                                        : "border-border bg-background hover:border-[#74E79C]/30"
                                }`}
                            >
                                <div className="shrink-0">
                                    {step.done ? (
                                        <CheckCircle2 className="h-5 w-5 text-[#74E79C]" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground/40" />
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
                                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-7">
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

    const settings = settingsData || {};
    const businessType: string = settings.type || "abarrotera";
    const industryConfig = getIndustryConfig(businessType);
    const catalogLabel = industryConfig.view === "menu" ? "Menú" : "Catálogo";

    const recentOrders = (ordersData?.data || []) as RecentOrder[];
    const analytics = analyticsData?.data || analyticsData || {};
    const messageStats = analytics.messages || {};

    // ─── Onboarding steps ───────────────────────────────────────────────
    const hasName = Boolean(settings.name);
    const hasSlug = Boolean(settings.slug);
    const hasIndustry = Boolean(settings.type);
    const hasWhatsApp = Boolean(sessionBusinessPhoneId);
    const hasProducts = (stats?.active_products ?? 0) > 0;

    const onboardingSteps: OnboardingStep[] = [
        {
            id: "business",
            title: "Configura tu negocio",
            description: "Agrega nombre, tipo de industria y URL de tu catálogo público",
            done: hasName && hasSlug && hasIndustry,
            href: "/dashboard/settings",
            cta: "Configurar",
        },
        {
            id: "catalog",
            title: `Sube tu ${catalogLabel.toLowerCase()}`,
            description: "Agrega al menos un producto para que el agente pueda responder sobre tu oferta",
            done: hasProducts,
            href: "/dashboard/products",
            cta: "Agregar productos",
        },
        {
            id: "whatsapp",
            title: "Conecta tu WhatsApp Business",
            description: "Vincula tu número para recibir mensajes y activar el inbox, pedidos y clientes",
            done: hasWhatsApp,
            href: "/dashboard/settings?tab=conectar",
            cta: "Conectar",
        },
    ];

    const allOnboarded = onboardingSteps.every((s) => s.done);
    const isLoading = statsLoading || settingsLoading;

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Tablero General</h1>
                <p className="text-muted-foreground mt-2">
                    {allOnboarded
                        ? `Bienvenido a Merca-Connect. Aquí tienes un resumen de la actividad de tu negocio.`
                        : `Hola${settings.name ? `, ${settings.name}` : ""}. Completa los pasos para activar todas las funciones.`
                    }
                </p>
            </motion.div>

            {/* Onboarding checklist — desaparece cuando todo está completo */}
            <AnimatePresence>
                {!isLoading && !allOnboarded && (
                    <OnboardingCard steps={onboardingSteps} />
                )}
            </AnimatePresence>

            {/* Métricas — siempre visibles pero con estado vacío si no hay datos */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats?.total_orders || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.new_orders || 0} pendientes de entregar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos (Est)</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                ${(stats?.estimated_revenue || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Basado en pedidos listos/entregados</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{catalogLabel} activo</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats?.active_products || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {hasProducts ? `${industryConfig.productLabel.toLowerCase()}s visibles` : `Agrega tu primer ${industryConfig.productLabel.toLowerCase()}`}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats?.total_customers || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {hasWhatsApp ? "Interacciones vía WhatsApp" : "Disponible al conectar WhatsApp"}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Contenido principal — solo cuando hay WhatsApp */}
            {hasWhatsApp ? (
                <motion.div
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4"
                    variants={itemVariants}
                >
                    <Card className="col-span-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader>
                            <CardTitle>Resumen de Mensajes</CardTitle>
                            <CardDescription>Actividad de conversaciones del negocio</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Enviados hoy</p>
                                        <p className="text-xl font-bold text-foreground">{messageStats.sent_today ?? 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Recibidos hoy</p>
                                        <p className="text-xl font-bold text-foreground">{messageStats.received_today ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between items-center py-1.5 border-b border-border">
                                    <span className="text-muted-foreground">Esta semana (env.)</span>
                                    <span className="font-medium tabular-nums">{messageStats.sent_this_week ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-border">
                                    <span className="text-muted-foreground">Esta semana (rec.)</span>
                                    <span className="font-medium tabular-nums">{messageStats.received_this_week ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">Este mes (env.)</span>
                                    <span className="font-medium tabular-nums">{messageStats.sent_this_month ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">Este mes (rec.)</span>
                                    <span className="font-medium tabular-nums">{messageStats.received_this_month ?? 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                        <CardHeader>
                            <CardTitle>Últimos Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ordersLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">
                                                    #{order.id.split("-")[0].toUpperCase()}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ${formatCurrency(order.total)} — {order.items?.length || 0} artículos
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                order.status === "entregado" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                order.status === "pendiente" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                order.status === "cancelado" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            }`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-2">
                                            No hay pedidos recientes.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                /* Estado vacío cuando no hay WhatsApp — call to action limpio */
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <div className="p-3 rounded-full bg-muted">
                                <Smartphone className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Inbox y Pedidos</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">
                                    Conecta tu WhatsApp Business para ver conversaciones y pedidos en tiempo real
                                </p>
                            </div>
                            <Link href="/dashboard/settings">
                                <Button size="sm" variant="outline" className="gap-2 mt-1">
                                    <Settings className="h-3.5 w-3.5" />
                                    Ir a Conectar
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <div className="p-3 rounded-full bg-muted">
                                <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    {hasProducts ? `${stats?.active_products} ${industryConfig.productLabel.toLowerCase()}s cargados` : `Tu ${catalogLabel}`}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">
                                    {hasProducts
                                        ? "Tu catálogo está listo. Conecta WhatsApp para que el agente empiece a vender."
                                        : `Empieza cargando tu ${catalogLabel.toLowerCase()} — puedes hacerlo antes de conectar WhatsApp`
                                    }
                                </p>
                            </div>
                            <Link href="/dashboard/products">
                                <Button size="sm" variant="outline" className="gap-2 mt-1">
                                    <Package className="h-3.5 w-3.5" />
                                    {hasProducts ? "Ver catálogo" : `Agregar ${industryConfig.productLabel.toLowerCase()}s`}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
