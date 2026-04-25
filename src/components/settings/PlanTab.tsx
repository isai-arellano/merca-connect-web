"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  CreditCard,
  Users,
  Calendar,
  History,
  Loader2,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetcher, apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { type PlanUsage, type SeatUser, type BillingCycle } from "@/types/api";

export function PlanTab() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [savingExtra, setSavingExtra] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  // ── Invite dialog state ──
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [inviting, setInviting] = useState(false);

  const {
    data: planRaw,
    isLoading,
    mutate: mutatePlan,
  } = useSWR<PlanUsage | { data: PlanUsage }>(
    session ? endpoints.business.planUsage : null,
    fetcher
  );

  const { data: seatsRaw, mutate: mutateSeats } = useSWR<SeatUser[] | { data: SeatUser[] }>(
    session ? endpoints.seats.list : null,
    fetcher
  );

  const { data: billingRaw } = useSWR<BillingCycle[] | { data: BillingCycle[] }>(
    session && showBilling ? endpoints.business.billingCycles : null,
    fetcher
  );

  const plan: PlanUsage | null =
    (planRaw as { data: PlanUsage } | null)?.data ??
    (planRaw as PlanUsage | null) ??
    null;

  const seats: SeatUser[] =
    (seatsRaw as { data: SeatUser[] } | null)?.data ??
    (seatsRaw as SeatUser[] | null) ??
    [];

  const cycles: BillingCycle[] =
    (billingRaw as { data: BillingCycle[] } | null)?.data ??
    (billingRaw as BillingCycle[] | null) ??
    [];

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const handleToggleExtra = async (checked: boolean) => {
    if (!plan) return;
    setSavingExtra(true);
    try {
      await apiClient.patch(endpoints.business.planAllowExtra, {
        allow_extra_conversations: checked,
      });
      await mutatePlan();
      toast({
        title: checked ? "Conversaciones extra habilitadas" : "Conversaciones extra deshabilitadas",
        description: checked
          ? `Se cobrarán $${plan.extra_conv_price_mxn} MXN por conversación adicional.`
          : "El agente no atenderá nuevas conversaciones al llegar al límite.",
      });
    } catch {
      toast({
        title: "Error al actualizar",
        description: "No se pudo cambiar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSavingExtra(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
      toast({ title: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await apiClient.post(endpoints.seats.invite, inviteForm);
      await Promise.all([mutateSeats(), mutatePlan()]);
      setInviteOpen(false);
      setInviteForm({ name: "", email: "", password: "" });
      toast({ title: "Usuario invitado correctamente." });
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ??
        "No se pudo invitar al usuario. Verifica que el email no esté registrado o que no hayas superado el límite de asientos.";
      toast({ title: "Error al invitar", description: detail, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await apiClient.delete(endpoints.seats.deactivate(userId));
      await Promise.all([mutateSeats(), mutatePlan()]);
      toast({ title: "Usuario desactivado." });
    } catch {
      toast({ title: "Error al desactivar usuario.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No se pudo cargar la información del plan.
        </CardContent>
      </Card>
    );
  }

  const usagePercent = Math.min(
    100,
    Math.round((plan.conversations_used / plan.conversations_limit) * 100)
  );

  return (
    <div className="space-y-4">
      {/* ── Plan & usage card ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Plan actual
              </CardTitle>
              <CardDescription className="mt-0.5">
                Uso de conversaciones, asientos y configuración de sobrecuota.
              </CardDescription>
            </div>
            <Badge className="text-sm font-semibold px-3 py-1" variant="outline">
              {plan.plan_display_name}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Near-limit warning */}
          {plan.near_limit && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Estás cerca del límite del plan</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Has usado el {usagePercent}% de tus conversaciones este mes. Considera habilitar
                  conversaciones extra o hacer upgrade.
                </p>
              </div>
            </div>
          )}

          {/* Conversations usage bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Conversaciones este mes</span>
              <span className="tabular-nums text-muted-foreground">
                {plan.conversations_used} / {plan.conversations_limit}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  plan.near_limit ? "bg-amber-400" : "bg-brand-spring"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El contador se reinicia en {plan.days_until_reset} día
              {plan.days_until_reset !== 1 ? "s" : ""}.
            </p>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Precio del plan</span>
            </div>
            <span className="font-semibold text-foreground">
              ${plan.price_mxn.toLocaleString("es-MX")} MXN/mes
            </span>
          </div>

          {/* Seats summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Asientos</span>
            </div>
            <span className="font-semibold text-foreground">
              {plan.seats_used} de {plan.seats_limit} usados
            </span>
          </div>

          {/* History */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="h-4 w-4" />
              <span>Historial de conversaciones</span>
            </div>
            <span className="font-semibold text-foreground">{plan.history_days} días</span>
          </div>

          {/* Reset countdown */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Renovación del plan</span>
            </div>
            <span className="font-semibold text-foreground">En {plan.days_until_reset} días</span>
          </div>

          <Separator />

          {/* Extra conversations toggle */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="extra-conv-toggle" className="text-sm font-medium cursor-pointer">
                Permitir conversaciones extra
              </Label>
              <p className="text-xs text-muted-foreground leading-snug">
                Al superar el límite del plan, el agente seguirá atendiendo. Se cobrarán{" "}
                <span className="font-medium text-foreground">
                  ${plan.extra_conv_price_mxn} MXN
                </span>{" "}
                por cada conversación adicional.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {savingExtra && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              <Switch
                id="extra-conv-toggle"
                checked={plan.allow_extra_conversations}
                onCheckedChange={handleToggleExtra}
                disabled={savingExtra}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Seats management card ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Usuarios del panel
              </CardTitle>
              <CardDescription className="mt-0.5">
                {plan.seats_used} de {plan.seats_limit} asientos usados en tu plan{" "}
                {plan.plan_display_name}.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setInviteOpen(true)}
              disabled={plan.seats_used >= plan.seats_limit}
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Invitar usuario
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {seats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="divide-y">
              {seats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{seat.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{seat.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {seat.role}
                    </Badge>
                    {seat.id !== currentUserId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {seat.name} perderá acceso al panel. Esta acción no elimina al usuario
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeactivate(seat.id)}
                            >
                              Desactivar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Billing history card ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Historial de ciclos
              </CardTitle>
              <CardDescription className="mt-0.5">
                Últimos 12 meses de facturación y uso de conversaciones.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowBilling((v) => !v)}>
              {showBilling ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1.5" /> Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1.5" /> Ver historial
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {showBilling && (
          <CardContent>
            {cycles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay ciclos registrados aún.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left pb-2 font-medium">Periodo</th>
                      <th className="text-right pb-2 font-medium">Conversaciones</th>
                      <th className="text-right pb-2 font-medium">Extras</th>
                      <th className="text-right pb-2 font-medium">Costo extra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cycles.map((cycle) => {
                      const start = new Date(cycle.period_start).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      });
                      const end = new Date(cycle.period_end).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      return (
                        <tr key={cycle.id} className="text-foreground">
                          <td className="py-2.5 pr-4">
                            {start} – {end}
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">
                            {cycle.conversations_used} / {cycle.conversations_included}
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">
                            {cycle.extra_conversations > 0 ? (
                              <span className="text-amber-600">{cycle.extra_conversations}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            {cycle.extra_amount_mxn > 0 ? (
                              <span className="text-amber-600">
                                ${Number(cycle.extra_amount_mxn).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Invite dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
            <DialogDescription>
              El nuevo usuario podrá acceder al panel con estas credenciales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Nombre</Label>
              <Input
                id="invite-name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="correo@negocio.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-password">Contraseña temporal</Label>
              <div className="relative">
                <Input
                  id="invite-password"
                  type={showPassword ? "text" : "password"}
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Invitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
