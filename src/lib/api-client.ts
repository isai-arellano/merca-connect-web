import { getSession } from "next-auth/react";
import { API_URL, CLIENT_BUILD_ID } from "./api";

export class ApiError extends Error {
    status: number;
    responseBody?: unknown;
    constructor(status: number, message: string, responseBody?: unknown) {
        super(message);
        this.status = status;
        this.responseBody = responseBody;
        this.name = "ApiError";
    }
}

export class NetworkError extends Error {
    cause?: unknown;
    constructor(message: string, cause?: unknown) {
        super(message);
        this.cause = cause;
        this.name = "NetworkError";
    }
}

interface SessionWithAccessToken {
    accessToken?: string;
}

let clientIdentityLogged = false;

function resolveUrl(url: string): string {
    return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

async function parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return null;
    }
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function getAuthHeaders(optionsHeaders: HeadersInit = {}): Promise<Headers> {
    const headers = new Headers(optionsHeaders);
    headers.set("Content-Type", "application/json");
    headers.set("X-Client-App", "merca-connect-web");
    headers.set("X-Client-Build", CLIENT_BUILD_ID);

    if (typeof window !== "undefined") {
        if (!clientIdentityLogged) {
            console.info("[api-client] runtime identity", {
                apiUrl: API_URL,
                buildId: CLIENT_BUILD_ID,
            });
            clientIdentityLogged = true;
        }
        const session = await getSession() as SessionWithAccessToken | null;
        const token = session?.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }
    return headers;
}

async function requestJson<TResponse>(url: string, options: RequestInit): Promise<TResponse> {
    try {
        const res = await fetch(resolveUrl(url), options);

        if (!res.ok) {
            const responseBody = await parseResponseBody(res);
            const apiMessage = typeof responseBody === "object" && responseBody !== null
                && "detail" in responseBody && typeof (responseBody as Record<string, unknown>).detail === "string"
                ? (responseBody as Record<string, string>).detail
                : `API Error: ${res.status} ${res.statusText}`;
            throw new ApiError(res.status, apiMessage, responseBody);
        }

        if (res.status === 204) {
            return null as TResponse;
        }

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            return null as TResponse;
        }

        return await res.json() as TResponse;
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (isAbortError(error)) {
            throw new NetworkError("La solicitud fue cancelada antes de completarse.", error);
        }
        if (error instanceof TypeError) {
            throw new NetworkError(
                "No se pudo conectar con la API. Verifica tu conexión, NEXT_PUBLIC_API_URL y CORS del entorno.",
                error
            );
        }
        throw new NetworkError("Ocurrió un error de red inesperado.", error);
    }
}

export const apiClient = {
    get: async <TResponse = unknown>(url: string, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        return requestJson<TResponse>(url, {
            ...options,
            method: "GET",
            headers,
        });
    },

    post: async <TResponse = unknown>(url: string, body: unknown, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        return requestJson<TResponse>(url, {
            ...options,
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });
    },

    patch: async <TResponse = unknown>(url: string, body: unknown, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        return requestJson<TResponse>(url, {
            ...options,
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
        });
    },

    delete: async <TResponse = unknown>(url: string, options: RequestInit = {}) => {
        const headers = await getAuthHeaders(options.headers);
        return requestJson<TResponse>(url, {
            ...options,
            method: "DELETE",
            headers,
        });
    },

    uploadForm: async <TResponse = unknown>(url: string, formData: FormData) => {
        // No incluir Content-Type — el browser lo establece con el boundary correcto
        const session = typeof window !== "undefined" ? await getSession() as SessionWithAccessToken | null : null;
        const token = session?.accessToken;
        const headers = new Headers();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return requestJson<TResponse>(url, { method: "POST", headers, body: formData });
    },
};

export const fetcher = <T = unknown>(url: string): Promise<T> => apiClient.get<T>(url);
