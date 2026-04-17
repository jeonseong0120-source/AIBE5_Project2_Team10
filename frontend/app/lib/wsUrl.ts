import { resolveApiBaseUrl } from "./axios";

/** STOMP SockJS 엔드포인트는 `/api` 접두사 밖에 둡니다. */
export function resolveSockJsUrl(): string {
    const api = resolveApiBaseUrl();
    const url = new URL(api);
    url.search = "";
    url.hash = "";
    const basePath = url.pathname.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
    return `${url.origin}${basePath}/ws-chat`;
}
