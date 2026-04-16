"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ShieldAlert, Plus, Loader2, CheckCircle2, Building2, Wifi, WifiOff } from "lucide-react";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { type Business, type ApiList, type ProvisionResult } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [form, setForm] = useState({ business_name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [lastProvisioned, setLastProvisioned] = useState<{ business_id: string; email: string } | null>(null);

    const { data: bizData, isLoading: bizLoading, mutate } = useSWR<ApiList<Business>>(
        session?.role === "admin" ? endpoints.admin.businesses : null,
        fetcher
    );
    const businesses: Business[] = bizData?.data ?? [];

    if (status === "loading") {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    if (session?.role !== "admin") {
        router.replace("/dashboard");
        return null;
    }

    async function handleProvision(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await apiClient.post<ProvisionResult>(endpoints.admin.provision, form);
            const data: ProvisionResult = (res as unknown as { data: ProvisionResult }).data ?? res;
            setLastProvisioned({ business_id: data.business_id, email: data.email });
            setForm({ business_name: "", email: "", password: "" });
            await mutate();
            toast({ title: "Cliente creado", description: `${data.email}` });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Gestión de negocios en la plataforma</p>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                {/* Form nuevo cliente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Plus className="h-4 w-4" />
                            Nuevo Cliente
                        </CardTitle>
                        <CardDescription>
                            El cliente recibirá el email y contraseña para entrar al panel y conectar su WhatsApp desde Settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProvision} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="business_name">Nombre del negocio</Label>
                                <Input id="business_name" placeholder="Abarrotes Don Pepe" value={form.business_name}
                                    onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email del operador</Label>
                                <Input id="email" type="email" placeholder="donpepe@gmail.com" value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Contraseña temporal</Label>
                                <Input id="password" type="password" placeholder="mínimo 8 caracteres" value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Crear cliente
                            </Button>
                        </form>

                        {lastProvisioned && (
                            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Cliente creado correctamente
                                </div>
                                <p className="text-xs text-muted-foreground">{lastProvisioned.email}</p>
                                <p className="text-xs text-muted-foreground font-mono">{lastProvisioned.business_id}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de negocios */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base flex-wrap">
                            <Building2 className="h-4 w-4" />
                            Negocios registrados
                            <Badge variant="secondary" className="sm:ml-auto">{businesses.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bizLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                        ) : businesses.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Sin negocios aún</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {businesses.map((b) => (
                                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/20">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{b.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">{b.id}</p>
                                        </div>
                                        {b.signup_completed ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shrink-0 gap-1 self-start sm:self-auto">
                                                <Wifi className="h-3 w-3" />WA
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground shrink-0 gap-1 self-start sm:self-auto">
                                                <WifiOff className="h-3 w-3" />Sin WA
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
