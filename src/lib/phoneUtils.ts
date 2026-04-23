const DEFAULT_COUNTRY_CODE = "52";

export function normalizeE164(raw: string | null | undefined, defaultCountryCode = DEFAULT_COUNTRY_CODE): string {
    if (!raw) return "";
    const text = String(raw).trim();
    if (!text) return "";

    if (text.startsWith("+")) {
        const digits = text.replace(/\D/g, "");
        return digits ? `+${digits}` : "";
    }

    let digits = text.replace(/\D/g, "");
    if (!digits) return "";

    if (digits.startsWith("00") && digits.length > 2) {
        digits = digits.slice(2);
    }

    if (digits.length === 10) {
        return `+${defaultCountryCode}${digits}`;
    }
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith(defaultCountryCode)) {
        return `+${digits}`;
    }
    if (digits.length >= 8 && digits.length <= 15) {
        return `+${digits}`;
    }
    return text;
}

export function formatPhoneDisplay(raw: string | null | undefined): string {
    const normalized = normalizeE164(raw);
    if (!normalized) return "";

    const digits = normalized.slice(1);
    if (digits.startsWith("52") && (digits.length === 12 || digits.length === 13)) {
        const local = digits.slice(2);
        if (local.length === 10) {
            return `+52 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
        }
        if (local.length === 11) {
            return `+52 ${local.slice(0, 1)} (${local.slice(1, 3)}) ${local.slice(3, 7)}-${local.slice(7)}`;
        }
    }
    return normalized;
}
