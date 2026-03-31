import { getSession } from "next-auth/react";
import { API_URL } from "./api";

let cachedAccessToken: string | null = null;

// Helper para inyectar token en las opciones del Fetch
async function getAuthHeaders(optionsHeaders: HeadersInit = {}): Promise<Headers> {
    const headers = new Headers(optionsHeaders);
    headers.set("Content-Type", "application/json");

    if (typeof window !== "undefined") {
        // En lugar de llamar a getSession() en cada petición (lo cual hace un GET HTTP a NextAuth repetidamente)
        // usamos un token cacheado en memoria.
        if (!cachedAccessToken) {
            const session = await getSession();
            if (session && (session as any).accessToken) {
                cachedAccessToken = (session as any).accessToken;
            }
        }

        if (cachedAccessToken) {
            headers.set("Authorization", `Bearer ${cachedAccessToken}`);
        }
    }
    return headers;
}

// Wrapper sobre Fetch nativo para imitar la interfaz básica de Axios que armamos
export const apiClient = {
    get: async (url: string, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            ...options,
            method: "GET",
            headers,
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    post: async (url: string, body: any, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            ...options,
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    patch: async (url: string, body: any, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            ...options,
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    }
};

// Fetcher global para usar con SWR
export const fetcher = (url: string) => apiClient.get(url);
