export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem("accessToken");
    } catch {
        return null;
    }
}

export function parseJwt(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padLength = (4 - (normalized.length % 4)) % 4;
        const padded = normalized + "=".repeat(padLength);
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch (error) {
        console.error("JWT 파싱 실패:", error);
        return null;
    }
}

export function getCurrentUserId(): number | null {
    const token = getAccessToken();
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload) return null;

    const userId = payload.userId;

    if (typeof userId === "number") return userId;
    if (typeof userId === "string")
        {const parsed = Number(userId);
        return Number.isFinite(parsed) ? parsed : null;
        }

    return null;
}