"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    Smartphone,
    Zap,
    RefreshCw,
    ArrowRight,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// ─── Tipos del SDK de Facebook ────────────────────────────────────────────────

declare global {
    interface Window {
        FB?: {
            init: (options: {
                appId: string;
                autoLogAppEvents?: boolean;
                xfbml?: boolean;
                version: string;
            }) => void;
            login: (
                callback: (response: { authResponse?: { code: string } }) => void,
                options: { config_id: string; response_type: string; override_default_response_type: boolean }
            ) => void;
        };
        fbAsyncInit?: () => void;
    }
}

// ─── Estado del paso de conexión ─────────────────────────────────────────────

type Step = "idle" | "loading_sdk" | "awaiting_meta" | "saving" | "done" | "error";

interface SignupStatus {
    connected: boolean;
    waba_id?: string;
    display_phone?: string;
    phone_number?: string;
    meta_app_id?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function WhatsAppConnectTab() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [step, setStep] = useState<Step>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const sdkLoaded = useRef(false);

    // Acumula los datos que llegan por postMessage (pueden llegar antes del callback de FB.login)
    const pendingSignupData = useRef<{ phone_number_id?: string; waba_id?: string }>({});

    const {
        data: statusRes,
        isLoading: statusLoading,
        mutate: mutateStatus,
    } = useSWR(session ? endpoints.business.whatsappSignupStatus : null, fetcher);

    const status: SignupStatus = statusRes?.data || statusRes || {};

    // ── Cargar SDK de Facebook ───────────────────────────────────────────────
    useEffect(() => {
        if (sdkLoaded.current || !status.meta_app_id) return;
        sdkLoaded.current = true;

        window.fbAsyncInit = function () {
            window.FB?.init({
                appId:            status.meta_app_id!,
                autoLogAppEvents: true,
                xfbml:            true,
                version:          "v22.0",
            });
        };

        // Inyectar el script del SDK una sola vez
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id   = "facebook-jssdk";
            script.src  = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    }, [status.meta_app_id]);

    // ── Escuchar mensajes de Meta (postMessage) ──────────────────────────────
    // Meta envía phone_number_id y waba_id vía postMessage cuando el usuario
    // completa el flujo. Puede llegar antes o después del callback de FB.login.
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            let data: Record<string, unknown>;
            try {
                data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            } catch {
                return;
            }

            if (!data || typeof data !== "object") return;

            // Estructura: { type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { waba_id, phone_number_id } }
            if (data.type === "WA_EMBEDDED_SIGNUP") {
                const eventType = data.event as string | undefined;
                if (eventType !== "FINISH" && eventType !== "FINISH_ONLY_WABA") return;

                const inner = (data.data || {}) as { phone_number_id?: string; waba_id?: string };
                if (inner.phone_number_id) pendingSignupData.current.phone_number_id = inner.phone_number_id;
                if (inner.waba_id) pendingSignupData.current.waba_id = inner.waba_id;
            }
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // ── Iniciar flujo con FB.login ───────────────────────────────────────────
    function startEmbeddedSignup() {
        if (!window.FB) {
            setStep("error");
            setErrorMsg("El SDK de Meta no está disponible. Recarga la página e intenta de nuevo.");
            return;
        }
        if (!status.meta_app_id) {
            setStep("error");
            setErrorMsg("La App ID de Meta no está configurada en el servidor. Contacta al soporte.");
            return;
        }

        pendingSignupData.current = {};
        setStep("awaiting_meta");
        setErrorMsg(null);

        // El code llega en authResponse; phone_number_id y waba_id llegan por postMessage
        window.FB.login(
            (response) => {
                if (!response.authResponse?.code) {
                    setStep("idle");
                    return;
                }

                const code = response.authResponse.code;
                const { phone_number_id, waba_id } = pendingSignupData.current;

                if (!phone_number_id || !waba_id) {
                    // El postMessage puede llegar ligeramente después del callback
                    let attempts = 0;
                    const interval = setInterval(() => {
                        const d = pendingSignupData.current;
                        if (d.phone_number_id && d.waba_id) {
                            clearInterval(interval);
                            completeSignup(code, d.phone_number_id, d.waba_id);
                        } else if (++attempts >= 10) {
                            clearInterval(interval);
                            setStep("error");
                            setErrorMsg("Meta no devolvió los datos del número. Intenta de nuevo.");
                        }
                    }, 500);
                    return;
                }

                completeSignup(code, phone_number_id, waba_id);
            },
            {
                config_id:                      process.env.NEXT_PUBLIC_META_CONFIG_ID || "",
                response_type:                  "code",
                override_default_response_type: true,
            }
        );
    }

    // ── Enviar datos al backend ──────────────────────────────────────────────
    async function completeSignup(code: string, phone_number_id: string, waba_id: string) {
        setStep("saving");
        try {
            await apiClient.post(endpoints.business.whatsappSignupComplete, {
                code,
                phone_number_id,
                waba_id,
            });
            await mutateStatus();
            setStep("done");
            toast({
                title: "¡WhatsApp conectado!",
                description: "Tu número quedó vinculado y el webhook está activo.",
            });
        } catch (err: unknown) {
            setStep("error");
            const msg = err instanceof Error ? err.message : "Error desconocido";
            setErrorMsg(`No se pudo completar la conexión: ${msg}`);
            toast({
                title: "Error al conectar",
                description: "Intenta de nuevo o contacta al soporte.",
                variant: "destructive",
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    if (statusLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                    Conectar Número de WhatsApp
                </CardTitle>
                <CardDescription>
                    Vincula el número de WhatsApp Business de tu cliente con Merca-Connect
                    en menos de 2 minutos, sin tocar ninguna consola de Meta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Estado actual */}
                {status.connected ? (
                    <ConnectedState status={status} onReconnect={() => setStep("idle")} />
                ) : (
                    <DisconnectedState
                        step={step}
                        errorMsg={errorMsg}
                        onStart={startEmbeddedSignup}
                        onRetry={() => { setStep("idle"); setErrorMsg(null); }}
                    />
                )}

            </CardContent>
        </Card>
    );
}

// ─── Estado: ya conectado ─────────────────────────────────────────────────────

function ConnectedState({
    status,
    onReconnect,
}: {
    status: SignupStatus;
    onReconnect: () => void;
}) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-foreground">WhatsApp conectado</p>
                    <p className="text-sm text-muted-foreground">
                        El webhook está activo y los mensajes se están recibiendo.
                    </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Activo
                </Badge>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Número de WhatsApp" value={status.display_phone || status.phone_number || "—"} />
                <InfoRow label="WABA ID" value={status.waba_id || "—"} mono />
            </div>

            <Separator />

            <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                    Si necesitas cambiar el número conectado, reconecta con el nuevo número.
                    El número anterior dejará de recibir mensajes.
                </p>
            </div>

            <Button variant="outline" size="sm" onClick={onReconnect} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reconectar con otro número
            </Button>
        </div>
    );
}

// ─── Estado: sin conectar / flujo de conexión ────────────────────────────────

function DisconnectedState({
    step,
    errorMsg,
    onStart,
    onRetry,
}: {
    step: Step;
    errorMsg: string | null;
    onStart: () => void;
    onRetry: () => void;
}) {
    const isLoading = step === "awaiting_meta" || step === "saving";

    return (
        <div className="space-y-6">
            {/* Pasos del proceso */}
            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        num: "1",
                        title: "Inicia el flujo",
                        desc: "Haz clic en el botón y sigue las instrucciones de Meta",
                    },
                    {
                        num: "2",
                        title: "Conecta tu número",
                        desc: "Selecciona o crea tu WhatsApp Business Account en el asistente de Meta",
                    },
                    {
                        num: "3",
                        title: "Listo",
                        desc: "Tu número queda vinculado y empiezas a recibir mensajes",
                    },
                ].map((s) => (
                    <div
                        key={s.num}
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                    >
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {s.num}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Separator />

            {/* Mensaje de estado */}
            {step === "awaiting_meta" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Esperando que completes el flujo en la ventana de Meta...
                </div>
            )}
            {step === "saving" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizando conexión y configurando webhook...
                </div>
            )}
            {step === "error" && errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive">{errorMsg}</p>
                </div>
            )}

            {/* Botón principal */}
            <div className="flex items-center gap-3">
                {step === "error" ? (
                    <Button onClick={onRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Intentar de nuevo
                    </Button>
                ) : (
                    <Button
                        onClick={onStart}
                        disabled={isLoading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="lg"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4" />
                        )}
                        Conectar WhatsApp Business
                        {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Este proceso usa el flujo oficial de Meta (Embedded Signup).
                No necesitas configurar webhooks manualmente ni acceder a la consola de Meta for Developers.
            </p>
        </div>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </p>
            <p className={`text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>
                {value}
            </p>
        </div>
    );
}
