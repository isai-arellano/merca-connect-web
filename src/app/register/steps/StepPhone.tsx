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

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Último paso</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Tu número de WhatsApp del negocio.
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
