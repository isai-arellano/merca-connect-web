"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { RegisterFormState } from "@/types/registration";
import { endpoints } from "@/lib/api";

interface Props {
    form: RegisterFormState;
    updateForm: (partial: Partial<RegisterFormState>) => void;
    onNext: () => void;
    onBack: () => void;
    hideBack?: boolean;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function toSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60);
}

export function StepBusiness({ form, updateForm, onNext, onBack, hideBack = false }: Props) {
    const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
    const [error, setError] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleBusinessNameChange(value: string) {
        updateForm({ businessName: value });
        // Autocompletar slug desde el nombre si el usuario no lo ha editado manualmente
        const autoSlug = toSlug(value);
        updateForm({ slug: autoSlug });
        triggerSlugCheck(autoSlug);
    }

    function handleSlugChange(value: string) {
        const cleaned = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .slice(0, 60);
        updateForm({ slug: cleaned });
        triggerSlugCheck(cleaned);
    }

    function triggerSlugCheck(slug: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (slug.length < 3) {
            setSlugStatus(slug.length === 0 ? "idle" : "invalid");
            return;
        }
        setSlugStatus("checking");
        debounceRef.current = setTimeout(() => checkSlug(slug), 500);
    }

    async function checkSlug(slug: string) {
        try {
            const res = await fetch(endpoints.auth.checkSlug(slug));
            if (!res.ok) {
                setSlugStatus("idle");
                return;
            }
            const data = (await res.json()) as { available: boolean };
            setSlugStatus(data.available ? "available" : "taken");
        } catch {
            setSlugStatus("idle");
        }
    }

    function handleNext() {
        setError("");
        if (!form.businessName.trim()) {
            setError("El nombre del negocio es requerido.");
            return;
        }
        if (form.slug.length < 3) {
            setError("El slug debe tener al menos 3 caracteres.");
            return;
        }
        if (slugStatus === "taken") {
            setError("Este slug ya está en uso. Elige otro.");
            return;
        }
        if (slugStatus === "checking") {
            setError("Espera a que se verifique la disponibilidad del slug.");
            return;
        }
        onNext();
    }

    const slugStatusIcon = {
        idle: null,
        checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
        available: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        taken: <XCircle className="h-4 w-4 text-red-500" />,
        invalid: null,
    }[slugStatus];

    const slugStatusText = {
        idle: "",
        checking: "Verificando...",
        available: "Disponible",
        taken: "Ya está en uso",
        invalid: "Mínimo 3 caracteres",
    }[slugStatus];

    const slugStatusColor = {
        idle: "text-muted-foreground",
        checking: "text-muted-foreground",
        available: "text-green-600",
        taken: "text-red-600",
        invalid: "text-amber-600",
    }[slugStatus];

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Tu negocio</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    ¿Cómo se llama tu negocio y cuál será tu URL pública?
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="businessName" className="text-[#1A3E35] font-normal">
                    Nombre del negocio
                </Label>
                <Input
                    id="businessName"
                    type="text"
                    placeholder="Ej. Tacos El Güero"
                    value={form.businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    className="h-11 rounded-lg"
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="slug" className="text-[#1A3E35] font-normal">
                    URL pública
                </Label>
                <div className="relative">
                    <div className="flex items-center h-11 border border-border rounded-lg overflow-hidden focus-within:border-[#74E79C] focus-within:ring-1 focus-within:ring-[#74E79C]">
                        <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-border h-full flex items-center select-none whitespace-nowrap">
                            kolyn.mx/
                        </span>
                        <input
                            id="slug"
                            type="text"
                            placeholder="tu-negocio"
                            value={form.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className="flex-1 h-full px-3 text-sm outline-none bg-transparent"
                        />
                        <div className="px-3">
                            {slugStatusIcon}
                        </div>
                    </div>
                </div>
                {slugStatusText && (
                    <p className={`text-xs ${slugStatusColor}`}>{slugStatusText}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    Solo minúsculas, números y guiones. Ej: tacos-el-guero
                </p>
            </div>

            <div className="flex gap-3 pt-2">
                {!hideBack && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="h-11 px-4 font-normal rounded-lg"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={handleNext}
                    disabled={slugStatus === "checking" || slugStatus === "taken"}
                    className="flex-1 h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
                >
                    Continuar
                </Button>
            </div>
        </div>
    );
}
