/**
 * Normaliza el segmento de URL del catálogo/menú público.
 * Alineado con validación de slug en API y configuración (3–100 chars, kebab-case).
 */
const PUBLIC_CATALOG_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicCatalogSlug(raw: string): string | null {
    const s = raw.trim().toLowerCase();
    if (s.length < 3 || s.length > 100) {
        return null;
    }
    if (!PUBLIC_CATALOG_SLUG_RE.test(s)) {
        return null;
    }
    return s;
}
