"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import RegisterFlow from "./RegisterFlow";

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3E35]" />
                </div>
            }
        >
            <RegisterFlow />
        </Suspense>
    );
}
