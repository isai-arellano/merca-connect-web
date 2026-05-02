import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren sesión autenticada con business completo
const PROTECTED_PREFIXES = ["/dashboard"];

// Rutas solo para usuarios sin sesión
const AUTH_ONLY_ROUTES = ["/login", "/register"];

// Ruta para usuarios autenticados sin negocio (onboarding pendiente)
const ONBOARDING_ROUTE = "/onboarding";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token && token.error !== "TokenExpired";
    const hasBusiness = isAuthenticated && !!token.businessId;

    // Token expirado → login
    if (token?.error === "TokenExpired") {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Rutas protegidas del dashboard
    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
        // Autenticado pero sin negocio → onboarding
        if (!hasBusiness) {
            return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
        }
        return NextResponse.next();
    }

    // /onboarding: solo para usuarios autenticados sin negocio
    if (pathname.startsWith(ONBOARDING_ROUTE)) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        if (hasBusiness) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // /login y /register: redirigir si ya está autenticado
    if (AUTH_ONLY_ROUTES.includes(pathname)) {
        if (isAuthenticated) {
            return NextResponse.redirect(
                new URL(hasBusiness ? "/dashboard" : ONBOARDING_ROUTE, request.url)
            );
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/onboarding/:path*",
        "/onboarding",
        "/login",
        "/register",
    ],
};
