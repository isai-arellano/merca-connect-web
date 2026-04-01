"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            if (res?.error) {
                setError("Las credenciales son incorrectas");
            } else {
                router.push(callbackUrl);
            }
        } catch (err) {
            setError("Ocurrio un error inesperado al iniciar sesion.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#74E79C] flex-col justify-between p-12">
                <div></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className="text-3xl xl:text-4xl font-bold text-[#1A3E35] leading-tight">
                        Tu negocio, automatizado{" "}
                        <span className="text-white">automatizado</span>
                    </h2>
                    <p className="mt-4 text-[#1A3E35]/70 text-lg max-w-md">
                        Gestiona pedidos, clientes y conversaciones desde un solo panel profesional.
                    </p>
                </motion.div>

                <div className="flex items-center gap-2">
                    <span className="text-[#1A3E35]/60 text-sm">Powered by</span>
                    <a href="https://kolyn.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        <Image
                            src="/kolyn-logo.png"
                            alt="Kolyn"
                            width={20}
                            height={20}
                            className="h-5 w-5"
                            unoptimized
                        />
                        <span className="text-[#1A3E35] text-sm font-medium">kolyn.io</span>
                    </a>
                </div>
            </div>

            {/* Right panel - login form */}
            <div className="flex-1 flex items-center justify-center bg-[#EEFAEE] px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Link href="/">
                            <Image
                                src="/images/isologo-principal.webp"
                                alt="MercaConnect"
                                width={140}
                                height={60}
                                className="w-28 h-auto object-contain"
                                priority
                                unoptimized
                            />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-[#74E79C]/20 p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-[#1A3E35] tracking-tight">
                                Iniciar Sesion
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Ingresa a tu panel de MercaConnect
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#1A3E35]">Correo Electronico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 border-gray-200 focus:border-[#74E79C] focus:ring-[#74E79C] placeholder:text-gray-400 rounded-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#1A3E35]">Contrasena</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 border-gray-200 focus:border-[#74E79C] focus:ring-[#74E79C] pr-10 placeholder:text-gray-400 rounded-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A3E35] transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-semibold rounded-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Acceder al Panel"
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 hover:text-[#1A3E35] transition-colors inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al inicio
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
