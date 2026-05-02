"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { CountryCode, DEFAULT_COUNTRY, RegisterFormState } from "@/types/registration";
import { endpoints } from "@/lib/api";

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
    const [countries, setCountries] = useState<CountryCode[]>([DEFAULT_COUNTRY]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    // Carga la lista de países activos desde el API al montar el componente
    useEffect(() => {
        fetch(endpoints.public.countryCodes)
            .then((r) => r.json())
            .then((data: CountryCode[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setCountries(data);
                    // Si el país actual del form no está en la lista devuelta, reseteamos a México
                    const current = data.find((c) => c.iso2 === form.phoneCountry.iso2);
                    if (!current) updateForm({ phoneCountry: data[0] });
                }
            })
            .catch(() => {
                // Si falla el fetch usamos el default (México) sin romper el flujo
            })
            .finally(() => setLoadingCountries(false));
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit() {
        setError("");

        const digits = form.phoneNumber.trim().replace(/\s/g, "").replace(/-/g, "");
        if (!digits) {
            setError("El número de WhatsApp es requerido.");
            return;
        }
        // Valida que solo haya dígitos y longitud razonable (7–12 dígitos locales)
        if (!/^\d{7,12}$/.test(digits)) {
            setError("Número inválido. Ingresa solo los dígitos locales, sin código de país.");
            return;
        }

        // El número completo se construye al enviar: +52 + 5512345678
        await onSubmit();
    }

    const selectedCountry = form.phoneCountry;

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
                <Label className="text-[#1A3E35] font-normal">
                    Número de WhatsApp del negocio
                </Label>

                <div className="flex gap-2">
                    {/* Dropdown de código de país */}
                    <Select
                        value={selectedCountry.iso2}
                        onValueChange={(iso2) => {
                            const found = countries.find((c) => c.iso2 === iso2);
                            if (found) updateForm({ phoneCountry: found });
                        }}
                        disabled={loadingCountries}
                    >
                        <SelectTrigger className="h-11 w-[120px] shrink-0 rounded-lg font-normal">
                            <SelectValue>
                                <span className="flex items-center gap-1.5">
                                    <span className="text-base leading-none">{selectedCountry.flag_emoji}</span>
                                    <span className="text-sm text-muted-foreground">+{selectedCountry.dial_code}</span>
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {countries.map((country) => (
                                <SelectItem key={country.iso2} value={country.iso2}>
                                    <span className="flex items-center gap-2">
                                        <span className="text-base leading-none">{country.flag_emoji}</span>
                                        <span>{country.name}</span>
                                        <span className="text-muted-foreground ml-auto pl-2">+{country.dial_code}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Campo de número local */}
                    <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="5512345678"
                        value={form.phoneNumber}
                        onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                        className="h-11 rounded-lg flex-1"
                        autoFocus
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    Ingresa el número sin el código de país. Se usará para conectar tu agente de WhatsApp.
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
                <a href="/terminos" target="_blank" className="underline hover:text-[#1A3E35]">
                    Términos de Servicio
                </a>{" "}
                y{" "}
                <a href="/privacidad" target="_blank" className="underline hover:text-[#1A3E35]">
                    Política de Privacidad
                </a>
                .
            </p>
        </div>
    );
}
