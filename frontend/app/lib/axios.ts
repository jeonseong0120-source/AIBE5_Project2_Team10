import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * API 베이스 URL.
 * - `NEXT_PUBLIC_API_BASE_URL` 이 있으면 최우선 (배포용 등).
 * - 브라우저에서 `localhost` / `127.0.0.1` 이면 **127.0.0.1:8080** 으로 고정해 IPv6(::1)만 바인딩된 백엔드와의 불일치를 줄임.
 * - 그 외(예: `192.168.x.x` 로 접속)에는 **현재 호스트의 8080** 으로 요청해 같은 PC/폰에서 백엔드에 닿게 함.
 */
export function resolveApiBaseUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/+$/, "");
    }
    if (typeof window !== "undefined") {
        const { protocol, hostname } = window.location;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return `${protocol}//127.0.0.1:8080/api`;
        }
        return `${protocol}//${hostname}:8080/api`;
    }
    return "http://127.0.0.1:8080/api";
}

const api: AxiosInstance = axios.create();

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        config.baseURL = resolveApiBaseUrl();
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: unknown) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log("세션이 만료되었습니다. 다시 로그인해주세요.");
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
            }
        }
        return Promise.reject(error);
    },
);

export default api;
