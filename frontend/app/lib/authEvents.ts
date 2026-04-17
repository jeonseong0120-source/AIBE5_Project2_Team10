/** 같은 탭에서 로그인·로그아웃 후에도 알림 등이 `me`/토큰을 다시 읽도록 브로드캐스트합니다. */
export const DEVNEAR_AUTH_CHANGED = "devnear-auth-changed";

export function notifyAuthChanged(): void {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(DEVNEAR_AUTH_CHANGED));
    }
}
