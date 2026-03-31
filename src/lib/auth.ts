import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { endpoints } from "./api";

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

                    if (!token) return null;

                    // En un sistema real aquí decodificas el JWT para sacar info del usuario,
                    // o haces un Fetch a /users/me para traer el nombre/email. 
                    // Por simplicidad, retornamos el token embebido.
                    return {
                        id: credentials.email, // placeholder
                        email: credentials.email,
                        accessToken: token,
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
            // Si el usuario acaba de hacer login, metemos el accessToken al token nativo de NextAuth
            if (user) {
                token.accessToken = (user as any).accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            // Exponemos el accessToken en la sesión para que el frontend pueda sacarlo y mandarlo al backend API
            (session as any).accessToken = token.accessToken;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

export default NextAuth(authOptions);
