"use client";

import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { NotificationsBell } from "@/components/layout/notifications-bell";
import { SidebarContent } from "@/components/layout/sidebar";

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Deferir hasta después de hidratar (evita mismatch SSR y permite next-auth en cliente)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration gate
        setMounted(true);
    }, []);

    return (
        <>
            {/* Barra horizontal — ocupa todo el ancho disponible (el padre en layout la posiciona) */}
            <header className="h-16 w-full flex items-center justify-between bg-[#F7F7F7] border border-border/80 rounded-2xl shadow-sm px-4 md:px-5">
                {/* Hamburger — solo móvil */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-muted-foreground hover:text-brand-forest hover:bg-brand-mint"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir menú</span>
                    </Button>
                </div>

                {/* Spacer desktop */}
                <div className="hidden md:block flex-1" />

                {/* Acciones */}
                {mounted ? (
                    <div className="flex items-center gap-1.5">
                        <NotificationsBell />
                        <div className="w-px h-5 bg-border/60 mx-1" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg bg-brand-mint text-brand-forest hover:bg-brand-mint/80 p-0 font-semibold text-sm"
                                >
                                    A
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    className="text-destructive cursor-pointer flex items-center gap-2"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="h-9 w-9 rounded-lg border border-border/70" />
                        <div className="w-px h-5 bg-border/60 mx-1" />
                        <div className="h-8 w-8 rounded-lg bg-brand-mint" />
                    </div>
                )}
            </header>

            {/* Sheet mobile — ancho completo hasta 280px */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="left"
                    className="w-full max-w-[280px] p-0 bg-[#F7F7F7] border-r border-border/80 flex flex-col"
                >
                    <VisuallyHidden>
                        <SheetTitle>Menú de navegación</SheetTitle>
                    </VisuallyHidden>

                    <div className="h-16 flex items-center px-5 border-b border-border/80 shrink-0">
                        <span className="font-bold text-[#1A3E35] text-sm tracking-tight">MercaConnect</span>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
