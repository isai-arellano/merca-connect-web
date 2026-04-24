/**
 * Contrato único para subidas multipart de imagen (logo, banner, producto):
 * mismo campo `file` que FastAPI `File(...)`, mismo `apiClient.uploadForm` (solo Authorization).
 */
import { endpoints } from "@/lib/api";
import { apiClient } from "@/lib/api-client";

/** MIME permitidos en cliente (alineado con validación Pillow/WebP en API). */
export const CLIENT_CATALOG_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

export const CLIENT_IMAGE_MAX_BYTES = {
    logo: 5 * 1024 * 1024,
    banner: 10 * 1024 * 1024,
    product: 10 * 1024 * 1024,
} as const;

export type ClientImageValidationFailure = {
    ok: false;
    title: string;
    description: string;
};

export type ClientImageValidationResult =
    | { ok: true }
    | ClientImageValidationFailure;

export function buildImageFormData(file: File): FormData {
    const fd = new FormData();
    fd.append("file", file);
    return fd;
}

/**
 * Validación previa en el navegador (misma regla que logo/banner en productos).
 */
export function validateClientCatalogImage(
    file: File,
    opts: { maxBytes: number; sizeLabel: string },
): ClientImageValidationResult {
    if (!CLIENT_CATALOG_IMAGE_MIME_TYPES.has(file.type)) {
        return {
            ok: false,
            title: "Formato no permitido",
            description: "Usa JPG, PNG, WEBP o GIF.",
        };
    }
    if (file.size > opts.maxBytes) {
        const mb = opts.maxBytes / (1024 * 1024);
        return {
            ok: false,
            title: "Archivo demasiado grande",
            description: `${opts.sizeLabel} debe ser menor a ${mb} MB.`,
        };
    }
    return { ok: true };
}

export async function uploadBusinessLogo(file: File): Promise<void> {
    await apiClient.uploadForm(endpoints.business.logoUpload, buildImageFormData(file));
}

export async function uploadBusinessBanner(file: File): Promise<void> {
    await apiClient.uploadForm(endpoints.business.bannerUpload, buildImageFormData(file));
}

export async function uploadProductImageAppend(productId: string, file: File): Promise<{ image_url: string; images: string[] }> {
    return apiClient.uploadForm<{ image_url: string; images: string[] }>(
        endpoints.products.uploadImage(productId),
        buildImageFormData(file),
    );
}

export async function uploadProductImageReplace<TResponse>(
    productId: string,
    imageIndex: number,
    file: File,
): Promise<TResponse> {
    return apiClient.uploadForm<TResponse>(
        endpoints.products.productImageAtIndex(productId, imageIndex),
        buildImageFormData(file),
        { method: "PUT" },
    );
}
