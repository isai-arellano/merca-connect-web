"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { INDUSTRIES, RegisterFormState } from "@/types/registration";

interface Props {
    form: RegisterFormState;
    updateForm: (partial: Partial<RegisterFormState>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepIndustry({ form, updateForm, onNext, onBack }: Props) {
    const [error, setError] = useState("");

    function handleSelect(industryId: string) {
        const industry = INDUSTRIES.find((i) => i.id === industryId) ?? null;
        updateForm({ selectedIndustry: industry });
    }

    function handleNext() {
        setError("");
        if (!form.selectedIndustry) {
            setError("Selecciona el tipo de negocio.");
            return;
        }
        if (form.selectedIndustry.isCustom && !form.customIndustry.trim()) {
            setError("Describe tu tipo de negocio.");
            return;
        }
        onNext();
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Tipo de negocio</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Esto configura automáticamente tu menú, catálogo y agente de IA.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((industry) => {
                    const isSelected = form.selectedIndustry?.id === industry.id;
                    return (
                        <button
                            key={industry.id}
                            type="button"
                            onClick={() => handleSelect(industry.id)}
                            className={`
                                flex flex-col items-center gap-2 p-3 rounded-xl border text-sm text-center
                                transition-all duration-150 cursor-pointer
                                ${isSelected
                                    ? "border-[#1A3E35] bg-[#1A3E35]/5 text-[#1A3E35] font-medium shadow-sm"
                                    : "border-border bg-card hover:border-[#1A3E35]/40 hover:bg-[#1A3E35]/3 text-foreground"
                                }
                            `}
                        >
                            <span className="text-2xl">{industry.icon}</span>
                            <span className="leading-tight">{industry.label}</span>
                        </button>
                    );
                })}
            </div>

            {form.selectedIndustry?.isCustom && (
                <div className="space-y-2">
                    <Label htmlFor="customIndustry" className="text-[#1A3E35] font-normal">
                        ¿Cuál es tu tipo de negocio?
                    </Label>
                    <Input
                        id="customIndustry"
                        type="text"
                        placeholder="Ej. Calentadores solares, spa, agencia de autos..."
                        value={form.customIndustry}
                        onChange={(e) => updateForm({ customIndustry: e.target.value })}
                        className="h-11 rounded-lg"
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                        Tu sugerencia nos ayuda a mejorar la plataforma.
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="h-11 px-4 font-normal rounded-lg"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
                >
                    Continuar
                </Button>
            </div>
        </div>
    );
}
