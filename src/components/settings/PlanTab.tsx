"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { AlertTriangle, CreditCard, Users, Calendar, History, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher, apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { type PlanUsage } from "@/types/api";

export function PlanTab() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [savingExtra, setSavingExtra] = useState(false);

  const {
    data: planRaw,
    isLoading,
    mutate,
  } = useSWR<PlanUsage | { data: PlanUsage }>(
    session ? endpoints.business.planUsage : null,
    fetcher
  );

  const plan: PlanUsage | null =
    (planRaw as { data: PlanUsage } | null)?.data ??
    (planRaw as PlanUsage | null) ??
    null;

  const handleToggleExtra = async (checked: boolean) => {
    if (!plan) return;
    setSavingExtra(true);
    try {
      await apiClient.patch(endpoints.business.planAllowExtra, {
        allow_extra_conversations: checked,
      });
      await mutate();
      toast({
        title: checked
          ? "Conversaciones extra habilitadas"
          : "Conversaciones extra deshabilitadas",
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
          <Badge
            className="text-sm font-semibold px-3 py-1"
            variant="outline"
          >
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
                Has usado el {usagePercent}% de tus conversaciones este mes. Considera habilitar conversaciones extra o hacer upgrade.
              </p>
            </div>
          </div>
        )}

        {/* Conversations usage */}
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
            El contador se reinicia en {plan.days_until_reset} día{plan.days_until_reset !== 1 ? "s" : ""}.
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

        {/* Seats */}
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
          <span className="font-semibold text-foreground">
            {plan.history_days} días
          </span>
        </div>

        {/* Reset countdown */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Renovación del plan</span>
          </div>
          <span className="font-semibold text-foreground">
            En {plan.days_until_reset} días
          </span>
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
  );
}
