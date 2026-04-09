import { getSession } from "next-auth/react";
import { API_URL } from "./api";
import type { Session } from "next-auth";

let cachedAccessToken: string | null = null;

export class ApiError extends Error {
    status: number;
    details: unknown;

    constructor(message: string, status: number, details: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

// Helper para inyectar token en las opciones del Fetch
async function getAuthHeaders(optionsHeaders: HeadersInit = {}): Promise<Headers> {
    const headers = new Headers(optionsHeaders);
    headers.set("Content-Type", "application/json");

    if (typeof window !== "undefined") {
        // En lugar de llamar a getSession() en cada petición (lo cual hace un GET HTTP a NextAuth repetidamente)
        // usamos un token cacheado en memoria.
        if (!cachedAccessToken) {
            const session = await getSession() as Session | null;
            if (session?.accessToken) {
                cachedAccessToken = session.accessToken;
            }
        }

        if (cachedAccessToken) {
            headers.set("Authorization", `Bearer ${cachedAccessToken}`);
        }
    }
    return headers;
}

async function parseResponse(res: Response): Promise<unknown> {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return res.json();
    }

    const text = await res.text();
    return text.length > 0 ? text : null;
}

function getErrorMessage(details: unknown, status: number, statusText: string): string {
    if (details && typeof details === "object" && "detail" in details) {
        const detail = (details as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.length > 0) {
            return detail;
        }
    }

    return `API Error: ${status} ${statusText}`;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = await getAuthHeaders(options.headers);
    const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
        ...options,
        headers,
    });

    const payload = await parseResponse(res);

    if (!res.ok) {
        throw new ApiError(
            getErrorMessage(payload, res.status, res.statusText),
            res.status,
            payload
        );
    }

    return payload as T;
}

export const apiClient = {
    get: <T>(url: string, options: RequestInit = {}) =>
        request<T>(url, { ...options, method: "GET" }),

    post: <T>(url: string, body: unknown, options: RequestInit = {}) =>
        request<T>(url, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        }),

    patch: <T>(url: string, body: unknown, options: RequestInit = {}) =>
        request<T>(url, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        }),
};

// Fetcher global para usar con SWR
export const fetcher = <T>(url: string) => apiClient.get<T>(url);
