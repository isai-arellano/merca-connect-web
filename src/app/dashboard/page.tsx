"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, Users, Activity, Loader2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";

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
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
    const { data: session } = useSession();
    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
    
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
    const recentOrders = (ordersData?.data || []) as RecentOrder[];
    
    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Tablero General</h1>
                <p className="text-muted-foreground mt-2">Bienvenido a Merca-Connect. Aquí tienes un resumen de la actividad reciente del negocio.</p>
            </motion.div>

            {(statsLoading) ? (
                 <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div variants={itemVariants}>
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
                    </motion.div>

                    <motion.div variants={itemVariants}>
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
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">
                                    {stats?.active_products || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">En el catálogo de WhatsApp</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">
                                    {stats?.total_customers || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Interacciones vía bot</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4" variants={itemVariants}>
                <Card className="col-span-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-md bg-slate-50 dark:bg-slate-900">
                            <p className="text-center px-4">
                                Módulo de Gráficas en Construcción <br/> 
                                <span className="text-xs opacity-70">Pronto verás el flujo de pedidos aquí.</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="col-span-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
                    <CardHeader>
                        <CardTitle>Últimos Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ordersLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/></div>
                        ) : (
                            <div className="space-y-4">
                                {recentOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">
                                                #{order.id.split('-')[0].toUpperCase()}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ${formatCurrency(order.total)} - {order.items?.length || 0} artículos
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            order.status === 'entregado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            order.status === 'pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            order.status === 'cancelado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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

        </motion.div>
    );
}
