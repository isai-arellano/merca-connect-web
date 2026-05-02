"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import {
    RegisterFormState,
    SELL_MODE_LABELS,
    SELL_TYPE_LABELS,
    SellMode,
    SellType,
} from "@/types/registration";

interface Props {
    form: RegisterFormState;
    updateForm: (partial: Partial<RegisterFormState>) => void;
    onNext: () => void;
    onBack: () => void;
}

const SELL_MODES: SellMode[] = ["delivery", "pickup", "digital"];
const SELL_TYPES: SellType[] = ["physical", "service", "both", "digital"];

export function StepSellMode({ form, updateForm, onNext, onBack }: Props) {
    const [error, setError] = useState("");

    function toggleSellMode(mode: SellMode) {
        const current = form.sellModes;
        const updated = current.includes(mode)
            ? current.filter((m) => m !== mode)
            : [...current, mode];
        updateForm({ sellModes: updated });
    }

    function handleNext() {
        setError("");
        if (form.sellModes.length === 0) {
            setError("Selecciona al menos un modo de venta.");
            return;
        }
        if (!form.sellType) {
            setError("Selecciona qué tipo de cosa vendes.");
            return;
        }
        onNext();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Cómo vendes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configura los canales y el tipo de lo que vendes.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Modos de venta — checkboxes múltiples */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#1A3E35]">
                    ¿Cómo llegas a tus clientes?
                    <span className="font-normal text-muted-foreground ml-1">(puedes elegir varios)</span>
                </p>
                <div className="space-y-2">
                    {SELL_MODES.map((mode) => {
                        const isSelected = form.sellModes.includes(mode);
                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => toggleSellMode(mode)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left
                                    transition-all duration-150 cursor-pointer
                                    ${isSelected
                                        ? "border-[#1A3E35] bg-[#1A3E35]/5 text-[#1A3E35]"
                                        : "border-border bg-card hover:border-[#1A3E35]/40 text-foreground"
                                    }
                                `}
                            >
                                <span
                                    className={`
                                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                        ${isSelected
                                            ? "border-[#1A3E35] bg-[#1A3E35]"
                                            : "border-gray-300 bg-white"
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </span>
                                {SELL_MODE_LABELS[mode]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tipo de lo que vende — radio único */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#1A3E35]">¿Qué vendes?</p>
                <div className="space-y-2">
                    {SELL_TYPES.map((type) => {
                        const isSelected = form.sellType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => updateForm({ sellType: type })}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left
                                    transition-all duration-150 cursor-pointer
                                    ${isSelected
                                        ? "border-[#1A3E35] bg-[#1A3E35]/5 text-[#1A3E35]"
                                        : "border-border bg-card hover:border-[#1A3E35]/40 text-foreground"
                                    }
                                `}
                            >
                                <span
                                    className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                        ${isSelected ? "border-[#1A3E35]" : "border-gray-300"}
                                    `}
                                >
                                    {isSelected && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E35]" />
                                    )}
                                </span>
                                {SELL_TYPE_LABELS[type]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-3">
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
