import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { endpoints } from "./api";

interface LoginResponse {
    access_token?: string;
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        business_id?: string | null;
        business_phone_id?: string | null;
        business_name?: string | null;
        role?: string | null;
    };
}

export const authOptions: NextAuthOptions = {
    providers: [
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
                        businessPhoneId: user.business_phone_id ?? null,
                        businessName: user.business_name ?? null,
                        role: user.role ?? "operator",
                    };
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.businessId = user.businessId ?? null;
                token.businessPhoneId = user.businessPhoneId ?? null;
                token.businessName = user.businessName ?? null;
                token.role = user.role ?? "operator";
            }

            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.sub,
                businessId: token.businessId ?? null,
                businessPhoneId: token.businessPhoneId ?? null,
                businessName: token.businessName ?? null,
            };
            session.accessToken = token.accessToken;
            session.businessId = token.businessId ?? null;
            session.businessPhoneId = token.businessPhoneId ?? null;
            session.businessName = token.businessName ?? null;
            session.role = token.role ?? "operator";

            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

export default NextAuth(authOptions);
