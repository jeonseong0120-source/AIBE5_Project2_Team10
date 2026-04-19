export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

export function parseJwt(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
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
    if (typeof userId === "string") return Number(userId);

    return null;
}