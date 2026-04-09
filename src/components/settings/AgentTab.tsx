"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Bot, Wrench, Loader2, AlertCircle, BotOff } from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { getBusinessPhoneId, withBusinessPhoneId } from "@/lib/business";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string;
  name: string;
  agent_type: string;
  personality: string | null;
  enabled_tools: string[];
  is_active: boolean;
}

interface BusinessSettings {
  config?: {
    agent_enabled?: boolean;
  };
}

interface BusinessSettingsResponse {
  data?: BusinessSettings;
}

type AgentConfigListResponse = AgentConfig[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Human-readable tool names */
const TOOL_LABELS: Record<string, string> = {
  search_catalog: "Búsqueda de catálogo",
  create_order: "Crear pedido",
  get_business_info: "Info del negocio",
  register_contact: "Registrar contacto",
  escalate_to_human: "Escalar a humano",
  send_rich_message: "Enviar mensaje enriquecido",
  schedule_appointment: "Agendar cita",
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  sales: "Agente de ventas",
  restaurant: "Agente de restaurante",
  scheduling: "Agente de agenda",
  support: "Agente de soporte",
};

// ─── Toggle Component ─────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-emerald-500" : "bg-muted-foreground/30"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
          ring-0 transition-transform duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentTab() {
  const { data: session, status } = useSession();
  const businessPhoneId = getBusinessPhoneId(session);
  const businessId = typeof session?.businessId === "string" && session.businessId.length > 0
    ? session.businessId
    : null;
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  // Fetch business settings to read current agent_enabled state
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSWR<BusinessSettingsResponse>(
    businessPhoneId ? withBusinessPhoneId(endpoints.business.settings, businessPhoneId) : null,
    fetcher
  );

  // Fetch agent config from kolyn-agents
  const {
    data: agentConfigsRes,
    isLoading: agentLoading,
    error: agentError,
  } = useSWR<AgentConfigListResponse>(
    businessId ? endpoints.agents.config(businessId) : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  const settings: BusinessSettings = settingsRes?.data ?? {};
  const agentEnabled: boolean = settings?.config?.agent_enabled ?? false;

  // agentConfigsRes is an array (list endpoint filtered by business_id)
  const agentConfig = agentConfigsRes?.[0] ?? null;

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);

    // Optimistic update
    const newValue = !agentEnabled;
    mutateSettings(
      (prev: BusinessSettingsResponse | undefined) => {
        const base = prev?.data ?? {};
        return {
          ...prev,
          data: {
            ...base,
            config: { ...(base.config || {}), agent_enabled: newValue },
          },
        };
      },
      { revalidate: false }
    );

    try {
      if (!businessPhoneId) {
        throw new Error("No se pudo identificar el negocio autenticado.");
      }

      await apiClient.patch(endpoints.business.agentToggle, {
        agent_enabled: newValue,
        business_phone_id: businessPhoneId,
      });
      mutateSettings(); // revalidate from server
      toast({
        title: newValue ? "Agente IA activado" : "Agente IA desactivado",
        description: newValue
          ? "El agente de IA atenderá las conversaciones automáticamente."
          : "Las conversaciones serán atendidas manualmente.",
      });
    } catch {
      // Revert optimistic update on error
      mutateSettings();
      toast({
        title: "Error al cambiar el estado",
        description: "No se pudo actualizar el agente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  const isLoading = status === "loading" || settingsLoading;

  return (
    <div className="space-y-4">
      {/* Toggle card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500" />
            Agente IA
          </CardTitle>
          <CardDescription>
            Activa el agente de inteligencia artificial para atender
            conversaciones automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-11 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">
                  {agentEnabled ? "Activo" : "Inactivo"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {agentEnabled
                    ? "El agente IA está respondiendo conversaciones."
                    : "Las conversaciones se atienden manualmente."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {toggling && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <ToggleSwitch
                  checked={agentEnabled}
                  onToggle={handleToggle}
                  disabled={toggling}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent config card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            Configuración del Agente
          </CardTitle>
          <CardDescription>
            Detalles de la configuración del agente asignado a este negocio.
            Solo lectura — los cambios se gestionan desde Kolyn Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : agentError ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No se pudo cargar la configuracion del agente
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {agentError instanceof Error
                    ? agentError.message
                    : "Verifica la sesion y la conexion con kolyn-agents."}
                </p>
              </div>
            </div>
          ) : agentConfig ? (
            <div className="space-y-5">
              {/* Name + type */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {agentConfig.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {AGENT_TYPE_LABELS[agentConfig.agent_type] ||
                      agentConfig.agent_type}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge
                    variant={agentConfig.is_active ? "default" : "secondary"}
                    className={
                      agentConfig.is_active
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : ""
                    }
                  >
                    {agentConfig.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Personality */}
              {agentConfig.personality && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Personalidad
                  </p>
                  <p className="text-sm text-foreground">
                    {agentConfig.personality.length > 200
                      ? `${agentConfig.personality.substring(0, 200)}…`
                      : agentConfig.personality}
                  </p>
                </div>
              )}

              {/* Tools */}
              {agentConfig.enabled_tools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Herramientas activas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agentConfig.enabled_tools.map((tool) => (
                      <Badge
                        key={tool}
                        variant="outline"
                        className="text-xs gap-1"
                      >
                        <Wrench className="h-3 w-3" />
                        {TOOL_LABELS[tool] || tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <BotOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No hay agente configurado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay agente configurado para este negocio. Contacta al
                  equipo de Kolyn para activar el agente.
                </p>
              </div>
              {/* Informational notice */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm text-left w-full mt-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  La configuración del agente se administra desde el panel de
                  Kolyn Console. Asegúrate de que kolyn-agents esté corriendo en
                  el puerto 8002.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
