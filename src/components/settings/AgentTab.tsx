"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bot, Loader2 } from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { getSessionBusinessId } from "@/lib/business";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { KnowledgeSection } from "@/components/settings/KnowledgeSection";

interface BusinessSettings {
  config?: {
    agent_enabled?: boolean;
  };
}

interface SettingsEnvelope {
  data?: BusinessSettings;
}

type SettingsResponse = SettingsEnvelope | BusinessSettings | undefined;

function isSettingsEnvelope(response: SettingsResponse): response is SettingsEnvelope {
  return typeof response === "object" && response !== null && "data" in response;
}

function normalizeBusinessSettings(response: SettingsResponse): BusinessSettings {
  if (!response) return {};
  return isSettingsEnvelope(response) ? response.data || {} : response;
}

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

export function AgentTab() {
  const { data: session } = useSession();
  const sessionBusinessId = getSessionBusinessId(session);
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  const {
    data: settingsRes,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSWR<SettingsResponse>(
    sessionBusinessId ? endpoints.business.settings : null,
    fetcher
  );

  const settings = normalizeBusinessSettings(settingsRes);
  const agentEnabled: boolean = settings?.config?.agent_enabled ?? false;

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);

    const newValue = !agentEnabled;
    mutateSettings(
      (prev: SettingsResponse) => {
        const base = normalizeBusinessSettings(prev);
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
      await apiClient.patch(endpoints.business.agentToggle, { agent_enabled: newValue });
      mutateSettings();
      toast({
        title: newValue ? "Agente IA activado" : "Agente IA desactivado",
        description: newValue
          ? "El agente de IA atenderá las conversaciones automáticamente."
          : "Las conversaciones se atienden manualmente.",
      });
    } catch {
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500" />
            Agente IA
          </CardTitle>
          <CardDescription>
            Activa el agente de inteligencia artificial para atender conversaciones automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
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
                {toggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <ToggleSwitch checked={agentEnabled} onToggle={handleToggle} disabled={toggling} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <KnowledgeSection />
    </div>
  );
}
