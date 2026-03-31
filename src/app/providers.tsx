"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api-client";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SessionProvider>
                <SWRConfig value={{ fetcher, revalidateOnFocus: false, refreshInterval: 0 }}>
                    {children}
                </SWRConfig>
            </SessionProvider>
        </ThemeProvider>
    );
}
