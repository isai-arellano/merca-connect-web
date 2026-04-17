"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, KeyRound, Loader2, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient, ApiError, NetworkError } from "@/lib/api-client";
import { endpoints } from "@/lib/api";

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface PasswordVisibility {
    current: boolean;
    new: boolean;
    confirm: boolean;
}

const INITIAL_FORM: PasswordForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

function ProfileInfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-0.5 py-3 border-b border-border/50 last:border-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </span>
            <span className="text-sm text-foreground">
                {value ?? <span className="italic text-muted-foreground">No disponible</span>}
            </span>
        </div>
    );
}

export default function ProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    const [form, setForm] = useState<PasswordForm>(INITIAL_FORM);
    const [visibility, setVisibility] = useState<PasswordVisibility>({
        current: false,
        new: false,
        confirm: false,
    });
    const [saving, setSaving] = useState(false);

    const toggleVisibility = (field: keyof PasswordVisibility) => {
        setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChange = (field: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            toast({
                title: "Las contraseñas no coinciden",
                description: "La nueva contraseña y su confirmación deben ser iguales.",
                variant: "destructive",
            });
            return;
        }

        if (form.newPassword.length < 8) {
            toast({
                title: "Contraseña demasiado corta",
                description: "La nueva contraseña debe tener al menos 8 caracteres.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            await apiClient.patch(endpoints.auth.changePassword, {
                current_password: form.currentPassword,
                new_password: form.newPassword,
            });
            toast({
                title: "Contraseña actualizada",
                description: "Tu contraseña se cambió correctamente.",
            });
            setForm(INITIAL_FORM);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                toast({
                    title: "Error al actualizar",
                    description: error.message,
                    variant: "destructive",
                });
            } else if (error instanceof NetworkError) {
                toast({
                    title: "Error de conectividad",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error inesperado",
                    description: "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
                    variant: "destructive",
                });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi perfil</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Información de tu cuenta
                </p>
            </div>

            {/* Account info card */}
            <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Información de la cuenta</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProfileInfoRow label="Nombre" value={session?.user?.name} />
                    <ProfileInfoRow label="Email" value={session?.user?.email} />
                    <ProfileInfoRow
                        label="Negocio"
                        value={session?.user?.businessName ?? session?.businessName}
                    />
                </CardContent>
            </Card>

            {/* Change password card */}
            <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Cambiar contraseña</CardTitle>
                    </div>
                    <CardDescription>Mínimo 8 caracteres</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current password */}
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Contraseña actual</Label>
                            <div className="relative">
                                <Input
                                    id="current-password"
                                    type={visibility.current ? "text" : "password"}
                                    value={form.currentPassword}
                                    onChange={handleChange("currentPassword")}
                                    autoComplete="current-password"
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility("current")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                    aria-label={visibility.current ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {visibility.current
                                        ? <EyeOff className="h-4 w-4" />
                                        : <Eye className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* New password */}
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={visibility.new ? "text" : "password"}
                                    value={form.newPassword}
                                    onChange={handleChange("newPassword")}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility("new")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                    aria-label={visibility.new ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {visibility.new
                                        ? <EyeOff className="h-4 w-4" />
                                        : <Eye className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={visibility.confirm ? "text" : "password"}
                                    value={form.confirmPassword}
                                    onChange={handleChange("confirmPassword")}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleVisibility("confirm")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                    aria-label={visibility.confirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {visibility.confirm
                                        ? <EyeOff className="h-4 w-4" />
                                        : <Eye className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" disabled={saving} className="gap-2">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Actualizar contraseña
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
