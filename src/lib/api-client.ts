import { getSession } from "next-auth/react";
import { API_URL } from "./api";

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function getAuthHeaders(optionsHeaders: HeadersInit = {}): Promise<Headers> {
    const headers = new Headers(optionsHeaders);
    headers.set("Content-Type", "application/json");

    if (typeof window !== "undefined") {
        const session = await getSession();
        const token = (session as any)?.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }
    return headers;
}

export const apiClient = {
    get: async (url: string, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            ...options,
            method: "GET",
            headers,
        });

        if (!res.ok) {
            throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
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
            throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
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
            throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    delete: async (url: string, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            ...options,
            method: "DELETE",
            headers,
        });

        if (!res.ok) {
            throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    uploadForm: async (url: string, formData: FormData) => {
        // No incluir Content-Type — el browser lo establece con el boundary correcto
        const session = typeof window !== "undefined" ? await getSession() : null;
        const token = (session as any)?.accessToken;
        const headers = new Headers();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        const res = await fetch(`${url.startsWith("http") ? url : API_URL + url}`, {
            method: "POST",
            headers,
            body: formData,
        });
        if (!res.ok) {
            throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },
};

export const fetcher = (url: string) => apiClient.get(url);
