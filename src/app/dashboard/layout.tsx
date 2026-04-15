"use client";

import { Sidebar, SidebarProvider, useSidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useEffect, useState } from "react";

function DashboardInner({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();
    // En móvil (< 768px) el sidebar está oculto, no desplazamos nada
    const [isMd, setIsMd] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        setIsMd(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const offset = isMd ? (collapsed ? 104 : 292) : 0;

    return (
        <>
            <Sidebar />

            {/* Navbar fijo, alineado al ancho del contenido */}
            <div
                className="fixed top-4 z-20 transition-all duration-300 ease-in-out"
                style={{
                    left: isMd ? offset : 16,
                    right: 16,
                }}
            >
                <Navbar />
            </div>

            {/* Contenido */}
            <main
                className="fixed bottom-4 transition-all duration-300 ease-in-out"
                style={{
                    left: isMd ? offset : 16,
                    right: 16,
                    top: 92,
                }}
            >
                <div className="h-full w-full rounded-2xl bg-[#F7F7F7] border border-border/70 shadow-sm p-3 sm:p-4 md:p-5">
                    <div className="dashboard-scroll h-full w-full overflow-y-auto pr-0.5">
                        <div className="space-y-5 min-h-full">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background">
                <DashboardInner>{children}</DashboardInner>
            </div>
        </SidebarProvider>
    );
}
