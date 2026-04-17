import { resolveApiBaseUrl } from "./axios";

/** STOMP SockJS 엔드포인트는 `/api` 접두사 밖에 둡니다. */
export function resolveSockJsUrl(): string {
    const api = resolveApiBaseUrl();
    const origin = api.replace(/\/api\/?$/i, "");
    return `${origin}/ws-chat`;
}
