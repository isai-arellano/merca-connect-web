import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { API_URL, endpoints } from "./api";
import type { UserRole } from "@/types/next-auth";

interface LoginResponse {
    access_token?: string;
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        business_id?: string | null;
        business_name?: string | null;
        role?: string | null;
    };
}

interface GoogleAuthResponse {
    access_token: string;
    token_type: string;
    needs_onboarding: boolean;
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        business_id?: string | null;
        business_name?: string | null;
        role?: string | null;
    } | null;
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const formData = new URLSearchParams();
                    formData.append("username", credentials.email);
                    formData.append("password", credentials.password);

                    const res = await fetch(endpoints.auth.login, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: formData,
                    });

                    if (!res.ok) {
                        return null;
                    }

                    const data: LoginResponse = await res.json();
                    const accessToken = data.access_token;
                    const user = data.user;

                    if (!accessToken || !user) return null;

                    return {
                        id: user.id,
                        name: user.name ?? undefined,
                        email: user.email ?? undefined,
                        accessToken,
                        businessId: user.business_id ?? null,
                        businessName: user.business_name ?? null,
                        role: (user.role ?? "operator") as UserRole,
                        needsOnboarding: false,
                    };
                } catch {
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 horas
    },
    callbacks: {
        async signIn({ user, account }) {
            // Solo interceptar el flujo de Google — intercambia el id_token con el backend
            if (account?.provider === "google" && account.id_token) {
                try {
                    const res = await fetch(`${API_URL}/api/v1/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id_token: account.id_token }),
                    });

                    if (!res.ok) return false;

                    const data: GoogleAuthResponse = await res.json();

                    // Inyectar los datos del backend en el objeto user de NextAuth
                    // Estos llegan al callback jwt() en el campo `user`
                    user.accessToken = data.access_token;
                    user.needsOnboarding = data.needs_onboarding;

                    if (data.user) {
                        user.id = data.user.id;
                        user.businessId = data.user.business_id ?? null;
                        user.businessName = data.user.business_name ?? null;
                        user.role = (data.user.role ?? "owner") as UserRole;
                    } else {
                        user.businessId = null;
                        user.businessName = null;
                        user.role = "owner";
                    }
                } catch {
                    return false;
                }
            }

            return true;
        },

        async jwt({ token, user }) {
            // Primera vez que el usuario hace login — guardar campos custom
            if (user) {
                token.accessToken = user.accessToken;
                token.businessId = user.businessId ?? null;
                token.businessName = user.businessName ?? null;
                token.role = user.role ?? "operator";
                token.needsOnboarding = user.needsOnboarding ?? false;
                // Timestamp de expiración (maxAge desde ahora)
                token.expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
            }

            // Token expirado — propagar error para que el cliente redirija a login
            if (token.expiresAt && Date.now() / 1000 > (token.expiresAt as number)) {
                return { ...token, error: "TokenExpired" as const };
            }

            return token;
        },

        async session({ session, token }) {
            // Propagar error de expiración al cliente
            if (token.error === "TokenExpired") {
                session.error = "TokenExpired";
            }

            session.user = {
                ...session.user,
                id: token.sub,
                businessId: token.businessId ?? null,
                businessName: token.businessName ?? null,
                role: token.role ?? "operator",
                needsOnboarding: token.needsOnboarding ?? false,
            };
            session.accessToken = token.accessToken;
            session.businessId = token.businessId ?? null;
            session.businessName = token.businessName ?? null;
            session.role = token.role ?? "operator";
            session.needsOnboarding = token.needsOnboarding ?? false;

            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

export default NextAuth(authOptions);
