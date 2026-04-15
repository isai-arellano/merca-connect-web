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
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
    subsets: ["latin"],
    weight: ["400"],
});

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
        <div className={`${openSans.className} flex min-h-screen bg-background text-foreground`}>
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[linear-gradient(140deg,#0f2a23_0%,#1A3E35_45%,#245a4a_100%)] text-[#EEFAEE] flex-col justify-between p-12 rounded-r-2xl">
                <div></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className="text-4xl xl:text-5xl font-normal leading-tight">
                        Tu negocio operando solo.
                    </h2>
                    <p className="mt-5 text-[#EEFAEE]/85 text-lg xl:text-xl max-w-md font-normal">
                        Gestiona pedidos, clientes y conversaciones desde un solo panel profesional.
                    </p>
                </motion.div>

                <div className="flex items-center gap-2">
                    <span className="text-[#EEFAEE]/70 text-sm">Powered by</span>
                    <a href="https://kolyn.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        <Image
                            src="/images/isologo-kolyn-white.webp"
                            alt="Kolyn"
                            width={101}
                            height={24}
                            className="h-5 w-auto object-contain"
                            unoptimized
                        />
                    </a>
                </div>
            </div>

            {/* Right panel - login form */}
            <div className="flex-1 flex items-center justify-center bg-[#F7F7F7] px-4 py-12">
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
                                width={160}
                                height={64}
                                className="w-32 h-auto object-contain"
                                priority
                                unoptimized
                            />
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-normal text-[#1A3E35] tracking-tight">
                                Iniciar Sesion
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1 font-normal">
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
                                <Label htmlFor="email" className="text-[#1A3E35] font-normal">Correo Electronico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 border-border focus:border-[#74E79C] focus:ring-[#74E79C] placeholder:text-gray-400 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#1A3E35] font-normal">Contrasena</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 border-border focus:border-[#74E79C] focus:ring-[#74E79C] pr-10 placeholder:text-gray-400 rounded-lg"
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
                                className="w-full h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-normal rounded-lg"
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
