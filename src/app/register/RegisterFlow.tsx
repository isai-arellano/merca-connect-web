"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Open_Sans } from "next/font/google";

import { INITIAL_FORM_STATE, RegisterFormState } from "@/types/registration";
import { StepAccount } from "./steps/StepAccount";
import { StepBusiness } from "./steps/StepBusiness";
import { StepIndustry } from "./steps/StepIndustry";
import { StepSellMode } from "./steps/StepSellMode";
import { StepPhone } from "./steps/StepPhone";
import { endpoints } from "@/lib/api";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400"] });

const STEP_LABELS = [
    "Tu cuenta",
    "Tu negocio",
    "Tipo de negocio",
    "Cómo vendes",
    "Contacto",
];

const TOTAL_STEPS = 5;

export default function RegisterFlow() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM_STATE);
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
                name: form.name,
                email: form.email,
                password: form.password,
                business_name: form.businessName,
                slug: form.slug,
                business_type: form.selectedIndustry.businessType,
                industry,
                sell_modes: form.sellModes,
                sell_type: form.sellType,
                phone: form.phone,
            };

            const res = await fetch(endpoints.auth.register, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSubmitError(
                    (data as { detail?: string }).detail ||
                    "Ocurrió un error al crear tu cuenta. Intenta de nuevo."
                );
                return;
            }

            // Iniciar sesión automáticamente con las credenciales recién creadas
            const signInResult = await signIn("credentials", {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (signInResult?.error) {
                // Cuenta creada pero login falló — redirigir a login
                router.push("/login?registered=1");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setSubmitError("Error de conexión. Verifica tu internet e intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
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
                    <h2 className="text-4xl xl:text-5xl font-normal leading-tight">
                        Tu negocio, automatizado.
                    </h2>
                    <p className="mt-5 text-[#EEFAEE]/85 text-lg xl:text-xl max-w-md font-normal">
                        Configura tu agente de IA en minutos y empieza a atender clientes en WhatsApp sin levantar el teléfono.
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

            {/* Panel derecho — formulario */}
            <div className="flex-1 flex items-start justify-center bg-[#F7F7F7] px-4 py-10 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Logo mobile */}
                    <div className="flex justify-center mb-6 lg:hidden">
                        <Link href="/">
                            <Image
                                src="/images/isologo-principal.webp"
                                alt="MercaConnect"
                                width={160}
                                height={64}
                                className="w-28 h-auto object-contain"
                                priority
                                unoptimized
                            />
                        </Link>
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
                                    <StepAccount
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                    />
                                )}
                                {step === 2 && (
                                    <StepBusiness
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                    />
                                )}
                                {step === 3 && (
                                    <StepIndustry
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                    />
                                )}
                                {step === 4 && (
                                    <StepSellMode
                                        form={form}
                                        updateForm={updateForm}
                                        onNext={goNext}
                                        onBack={goBack}
                                    />
                                )}
                                {step === 5 && (
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

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/login" className="text-[#1A3E35] hover:underline font-medium">
                            Inicia sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
