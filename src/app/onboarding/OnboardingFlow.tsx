"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Open_Sans } from "next/font/google";
import { Loader2 } from "lucide-react";

import { INITIAL_FORM_STATE, RegisterFormState } from "@/types/registration";
import { StepBusiness } from "@/app/register/steps/StepBusiness";
import { StepIndustry } from "@/app/register/steps/StepIndustry";
import { StepSellMode } from "@/app/register/steps/StepSellMode";
import { StepPhone } from "@/app/register/steps/StepPhone";
import { endpoints } from "@/lib/api";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400"] });

// Pasos 2-5 del flujo completo — el 1 (cuenta) ya fue con Google
const STEP_LABELS = ["Tu negocio", "Tipo de negocio", "Cómo vendes", "Contacto"];
const TOTAL_STEPS = 4;

export default function OnboardingFlow() {
    const { data: session, status, update: updateSession } = useSession();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState<RegisterFormState>({
        ...INITIAL_FORM_STATE,
        // El email ya está verificado — vino de Google
        emailVerified: true,
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    function updateForm(partial: Partial<RegisterFormState>) {
        setForm((prev) => ({ ...prev, ...partial }));
    }

    function goNext() {
        setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }

    function goBack() {
        setStep((s) => Math.max(s - 1, 1));
    }

    async function handleFinalSubmit() {
        if (!form.selectedIndustry || !form.sellType) return;

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const industry = form.selectedIndustry.isCustom
                ? form.customIndustry
                : form.selectedIndustry.id;

            const payload = {
                business_name: form.businessName,
                slug: form.slug,
                business_type: form.selectedIndustry.businessType,
                industry,
                sell_modes: form.sellModes,
                sell_type: form.sellType,
                phone: form.phone,
            };

            const res = await fetch(endpoints.auth.completeProfile, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSubmitError(
                    (data as { detail?: string }).detail ||
                    "Ocurrió un error. Intenta de nuevo."
                );
                return;
            }

            // Forzar refresco de sesión para que token incluya el nuevo business_id
            await updateSession();
            router.push("/dashboard");
        } catch {
            setSubmitError("Error de conexión. Verifica tu internet e intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7]">
                <Loader2 className="h-6 w-6 animate-spin text-[#1A3E35]" />
            </div>
        );
    }

    const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className={`${openSans.className} flex min-h-screen bg-background text-foreground`}>
            {/* Panel izquierdo — branding */}
            <div className="hidden lg:flex lg:w-5/12 bg-[linear-gradient(140deg,#0f2a23_0%,#1A3E35_45%,#245a4a_100%)] text-[#EEFAEE] flex-col justify-between p-12 rounded-r-2xl">
                <div />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <p className="text-[#74E79C] text-sm mb-3 font-medium">
                        Bienvenido, {session?.user?.name?.split(" ")[0] ?? ""}
                    </p>
                    <h2 className="text-4xl xl:text-5xl font-normal leading-tight">
                        Configura tu negocio en minutos.
                    </h2>
                    <p className="mt-5 text-[#EEFAEE]/85 text-lg xl:text-xl max-w-md font-normal">
                        Solo faltan unos datos para que tu agente de IA empiece a trabajar.
                    </p>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-[#EEFAEE]/70 text-sm">Powered by</span>
                    <Image
                        src="/images/isologo-kolyn-white.webp"
                        alt="Kolyn"
                        width={101}
                        height={24}
                        className="h-5 w-auto object-contain"
                        unoptimized
                    />
                </div>
            </div>

            {/* Panel derecho */}
            <div className="flex-1 flex items-start justify-center bg-[#F7F7F7] px-4 py-10 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Encabezado mobile */}
                    <div className="mb-6 lg:hidden">
                        <p className="text-[#1A3E35] font-medium">
                            Hola, {session?.user?.name?.split(" ")[0] ?? ""}
                        </p>
                        <p className="text-sm text-muted-foreground">Configura tu negocio</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">
                                Paso {step} de {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
                            </span>
                            <span className="text-xs font-medium text-[#1A3E35]">
                                {Math.round(progressPercent)}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#1A3E35] rounded-full"
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Tarjeta del paso */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                {step === 1 && (
                                    <StepBusiness
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                        hideBack
                                    />
                                )}
                                {step === 2 && (
                                    <StepIndustry
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                    />
                                )}
                                {step === 3 && (
                                    <StepSellMode
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                    />
                                )}
                                {step === 4 && (
                                    <StepPhone
                                        form={form}
                                        updateForm={updateForm}
                                        onBack={goBack}
                                        onSubmit={handleFinalSubmit}
                                        isSubmitting={isSubmitting}
                                        submitError={submitError}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
