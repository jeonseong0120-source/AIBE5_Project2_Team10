/**
 * 이메일 로그인·소셜 로그인·루트(/) 진입 시 동일한 역할 → 경로 규칙을 씁니다.
 */
export function postLoginPathForRole(role: string | undefined): string {
    const raw = role?.trim();
    if (!raw) return "/";

    const normalized = raw.startsWith("ROLE_") ? raw.slice(5) : raw;

    switch (normalized) {
        case "GUEST":
            return "/onboarding";
        case "CLIENT":
        case "BOTH":
            return "/client/dashboard";
        case "FREELANCER":
            return "/freelancer/dashboard";
        default:
            return "/";
    }
}
