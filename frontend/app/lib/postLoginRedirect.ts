/**
 * 이메일 로그인·소셜 로그인·루트(/) 진입 시 동일한 역할 → 경로 규칙을 씁니다.
 */
export function postLoginPathForRole(role: string | undefined): string {
    if (!role) return "/";
    if (role === "GUEST" || role === "ROLE_GUEST") return "/onboarding";
    if (["CLIENT", "BOTH", "ROLE_CLIENT", "ROLE_BOTH"].includes(role)) {
        return "/client/dashboard";
    }
    if (["FREELANCER", "ROLE_FREELANCER"].includes(role)) {
        return "/freelancer/dashboard";
    }
    return "/";
}
