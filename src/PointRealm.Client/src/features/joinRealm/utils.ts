
export interface ParseResult {
    code: string | null;
    error?: string;
    isUrl?: boolean;
}

export function parseRealmCode(input: string): ParseResult {
    if (!input) {
        return { code: null, error: "Realm code is required." };
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return { code: null, error: "Realm code is required." };
    }

    let codeCandidate = trimmed;
    let isUrl = false;

    // Check if it's a URL
    if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) {
        isUrl = true;
        try {
            const url = new URL(trimmed);
            // Assuming the structure is /something/{code} or just /{code}
            // We'll take the LAST path segment.
            // Example: https://pointrealm.com/r/AB1234 -> AB1234
            // Example: https://pointrealm.com/r/AB1234?foo=bar -> AB1234
            
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length === 0) {
                return { code: null, error: "Could not find realm code in URL." };
            }
            codeCandidate = segments[segments.length - 1]!;
        } catch {
            return { code: null, error: "Invalid URL format." };
        }
    }

    // Normalize
    const normalized = codeCandidate.trim().toUpperCase();

    // Validation Rules
    // 1. Length 4-12
    if (normalized.length < 4 || normalized.length > 12) {
        return { code: null, error: "Realm code must be 4-12 characters.", isUrl };
    }

    // 2. Charset A-Z, 0-9
    const validCharset = /^[A-Z0-9]+$/;
    if (!validCharset.test(normalized)) {
        return { code: null, error: "Realm code can only contain letters and numbers.", isUrl };
    }

    return { code: normalized, isUrl };
}
