import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { endpoints } from "./api";

interface AccessTokenPayload {
    sub?: string;
    business_id?: string;
    business_phone_id?: string;
}

function decodeJwtPayload(token: string): AccessTokenPayload | null {
    const [, payload] = token.split(".");

    if (!payload) {
        return null;
    }

    try {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessTokenPayload;
    } catch {
        return null;
    }
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
                    // Send form-urlencoded data as required by OAuth2PasswordRequestForm in FastAPI
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

                    const data = await res.json();
                    const token = data.access_token;
                    const payload = decodeJwtPayload(token);

                    if (!token || !payload?.business_id || !payload.business_phone_id) {
                        return null;
                    }

                    return {
                        id: payload.sub || credentials.email,
                        email: credentials.email,
                        accessToken: token,
                        businessId: payload.business_id,
                        businessPhoneId: payload.business_phone_id,
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
                token.businessId = user.businessId;
                token.businessPhoneId = user.businessPhoneId;
            }
            return token;
        },
        async session({ session, token }) {
            if (!token.accessToken || !token.businessId || !token.businessPhoneId) {
                throw new Error("Invalid authenticated session");
            }

            session.accessToken = token.accessToken;
            session.businessId = token.businessId;
            session.businessPhoneId = token.businessPhoneId;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

export default NextAuth(authOptions);
