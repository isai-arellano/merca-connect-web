"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { RegisterFormState } from "@/types/registration";

interface Props {
    form: RegisterFormState;
    updateForm: (partial: Partial<RegisterFormState>) => void;
    onBack: () => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    submitError: string;
}

export function StepPhone({
    form,
    updateForm,
    onBack,
    onSubmit,
    isSubmitting,
    submitError,
}: Props) {
    const [error, setError] = useState("");

    async function handleSubmit() {
        setError("");

        const phone = form.phone.trim().replace(/\s/g, "").replace(/-/g, "");
        if (!phone) {
            setError("El número de WhatsApp es requerido.");
            return;
        }
        if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
            setError("Número inválido. Incluye código de país. Ej: +525512345678");
            return;
        }

        await onSubmit();
    }

    const industryLabel = form.selectedIndustry?.isCustom
        ? form.customIndustry || "Tu negocio"
        : form.selectedIndustry?.label || "Tu negocio";

    const publicPath = (() => {
        const type = form.selectedIndustry?.businessType;
        if (type === "restaurant") return "/m/";
        if (type === "service") return "/a/";
        return "/c/";
    })();

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Último paso</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Tu número de WhatsApp y visibilidad pública.
                </p>
            </div>

            {(error || submitError) && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error || submitError}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#1A3E35] font-normal">
                    Número de WhatsApp del negocio
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+525512345678"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className="h-11 rounded-lg"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    Incluye código de país. Se usará para conectar tu agente de WhatsApp.
                </p>
            </div>

            {/* Toggle vitrina pública */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#1A3E35]">Vitrina pública</p>
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => updateForm({ catalogPublic: true })}
                        className={`
                            w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-left
                            transition-all duration-150 cursor-pointer
                            ${form.catalogPublic
                                ? "border-[#1A3E35] bg-[#1A3E35]/5 text-[#1A3E35]"
                                : "border-border bg-card hover:border-[#1A3E35]/40 text-foreground"
                            }
                        `}
                    >
                        <span
                            className={`
                                mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                ${form.catalogPublic ? "border-[#1A3E35]" : "border-gray-300"}
                            `}
                        >
                            {form.catalogPublic && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E35]" />
                            )}
                        </span>
                        <div>
                            <p className="font-medium">Sí — activar mi vitrina pública</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tus clientes podrán ver tu {industryLabel.toLowerCase()} en:{" "}
                                <span className="font-mono">kolyn.mx{publicPath}{form.slug || "tu-negocio"}</span>
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => updateForm({ catalogPublic: false })}
                        className={`
                            w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-left
                            transition-all duration-150 cursor-pointer
                            ${!form.catalogPublic
                                ? "border-[#1A3E35] bg-[#1A3E35]/5 text-[#1A3E35]"
                                : "border-border bg-card hover:border-[#1A3E35]/40 text-foreground"
                            }
                        `}
                    >
                        <span
                            className={`
                                mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                ${!form.catalogPublic ? "border-[#1A3E35]" : "border-gray-300"}
                            `}
                        >
                            {!form.catalogPublic && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E35]" />
                            )}
                        </span>
                        <div>
                            <p className="font-medium">No por ahora</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Solo usaré el agente de WhatsApp. Puedo activar la vitrina después desde Configuración.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="h-11 px-4 font-normal rounded-lg"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando tu cuenta...
                        </>
                    ) : (
                        "Crear mi cuenta"
                    )}
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Al crear tu cuenta aceptas nuestros{" "}
                <a href="/terminos" className="underline hover:text-[#1A3E35]">
                    Términos de Servicio
                </a>{" "}
                y{" "}
                <a href="/privacidad" className="underline hover:text-[#1A3E35]">
                    Política de Privacidad
                </a>
                .
            </p>
        </div>
    );
}
