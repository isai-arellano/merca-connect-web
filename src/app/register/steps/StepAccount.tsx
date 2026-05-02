"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { RegisterFormState } from "@/types/registration";
import { endpoints } from "@/lib/api";

interface Props {
    form: RegisterFormState;
    updateForm: (partial: Partial<RegisterFormState>) => void;
    onNext: () => void;
}

type Phase = "form" | "otp";

export function StepAccount({ form, updateForm, onNext }: Props) {
    const [phase, setPhase] = useState<Phase>(form.emailVerified ? "otp" : "form");
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(form.emailVerified);
    const [resendCooldown, setResendCooldown] = useState(false);

    async function handleSendOtp() {
        setError("");

        if (!form.name.trim()) {
            setError("Ingresa tu nombre completo.");
            return;
        }
        if (!form.email.trim() || !form.email.includes("@")) {
            setError("Ingresa un correo válido.");
            return;
        }
        if (form.password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(endpoints.auth.sendOtp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(
                    (data as { detail?: string }).detail ||
                    "No se pudo enviar el código. Intenta de nuevo."
                );
                return;
            }

            setOtpSent(true);
            setPhase("otp");
            startResendCooldown();
        } catch {
            setError("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleVerifyOtp() {
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            setError("El código debe ser de 6 dígitos.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(endpoints.auth.verifyEmail, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, otp }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(
                    (data as { detail?: string }).detail ||
                    "Código incorrecto. Intenta de nuevo."
                );
                return;
            }

            updateForm({ emailVerified: true });
            onNext();
        } catch {
            setError("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResendOtp() {
        if (resendCooldown) return;
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(endpoints.auth.resendOtp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(
                    (data as { detail?: string }).detail ||
                    "No se pudo reenviar el código."
                );
                return;
            }

            setOtp("");
            startResendCooldown();
        } catch {
            setError("Error de conexión.");
        } finally {
            setIsLoading(false);
        }
    }

    function startResendCooldown() {
        setResendCooldown(true);
        setTimeout(() => setResendCooldown(false), 60_000);
    }

    async function handleGoogleSignIn() {
        await signIn("google", { callbackUrl: "/onboarding" });
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-normal text-[#1A3E35]">Crea tu cuenta</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Empieza gratis — sin tarjeta de crédito.
                </p>
            </div>

            {phase === "form" ? (
                <div className="space-y-4">
                    {/* Google */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 font-normal gap-2"
                        onClick={handleGoogleSignIn}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continuar con Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs text-muted-foreground">
                            <span className="bg-card px-2">o con correo</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#1A3E35] font-normal">
                            Nombre completo
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Juan García"
                            value={form.name}
                            onChange={(e) => updateForm({ name: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#1A3E35] font-normal">
                            Correo electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="juan@minegocio.com"
                            value={form.email}
                            onChange={(e) => updateForm({ email: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[#1A3E35] font-normal">
                            Contraseña
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres"
                                value={form.password}
                                onChange={(e) => updateForm({ password: e.target.value })}
                                className="h-11 rounded-lg pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A3E35] transition-colors"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando código...
                            </>
                        ) : (
                            "Continuar"
                        )}
                    </Button>
                </div>
            ) : (
                /* Fase OTP */
                <div className="space-y-4">
                    <div className="text-center space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Enviamos un código a
                        </p>
                        <p className="font-medium text-[#1A3E35]">{form.email}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-[#1A3E35] font-normal">
                            Código de verificación
                        </Label>
                        <Input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="h-14 rounded-lg text-center text-2xl font-mono tracking-widest"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Expira en 15 minutos
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            "Verificar código"
                        )}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setPhase("form");
                                setOtp("");
                                setError("");
                            }}
                            className="text-muted-foreground hover:text-[#1A3E35] transition-colors"
                        >
                            Cambiar correo
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown || isLoading}
                            className="text-[#1A3E35] hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {resendCooldown ? "Reenviar en 1 min" : "Reenviar código"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
