"use client";

import Image from "next/image";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/layout/notifications-bell";

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#1A3E35] z-20 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                <div className="flex items-center">
                    <Image
                        src="/isologo-blanco.png"
                        alt="Merca Connect"
                        width={200}
                        height={100}
                        className="h-8 w-auto object-contain"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <NotificationsBell />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                            <span className="font-medium text-sm text-white">A</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            className="text-red-600 cursor-pointer flex items-center gap-2"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar sesion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
