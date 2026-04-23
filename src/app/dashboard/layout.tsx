"use client";

import { Sidebar, SidebarProvider, useSidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { EscalationPanel } from "@/components/layout/escalation-panel";
import { useEffect, useSyncExternalStore } from "react";
import { useSession, signOut } from "next-auth/react";

function TokenExpiryGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.error === "TokenExpired") {
            signOut({ callbackUrl: "/login" });
        }
    }, [session]);

    return <>{children}</>;
}

function useMinWidthMd(): boolean {
    return useSyncExternalStore(
        (onStoreChange) => {
            const mq = window.matchMedia("(min-width: 768px)");
            mq.addEventListener("change", onStoreChange);
            return () => mq.removeEventListener("change", onStoreChange);
        },
        () => window.matchMedia("(min-width: 768px)").matches,
        () => false
    );
}

function DashboardInner({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();
    // En móvil (< 768px) el sidebar está oculto, no desplazamos nada
    const isMd = useMinWidthMd();

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
                <div className="h-full w-full rounded-2xl bg-[#F7F7F7] border border-border/70 shadow-sm overflow-hidden relative [&:has(.inbox-fullbleed)]:bg-white">
                    <div className="dashboard-scroll h-full w-full overflow-y-auto [&:has(.inbox-fullbleed)]:overflow-hidden">
                        <div className="p-3 sm:p-4 md:p-5 space-y-5 min-h-full [&:has(.inbox-fullbleed)]:p-0 [&:has(.inbox-fullbleed)]:h-full [&:has(.inbox-fullbleed)]:space-y-0">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
            <EscalationPanel />
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
                <TokenExpiryGuard>
                    <DashboardInner>{children}</DashboardInner>
                </TokenExpiryGuard>
            </div>
        </SidebarProvider>
    );
}
