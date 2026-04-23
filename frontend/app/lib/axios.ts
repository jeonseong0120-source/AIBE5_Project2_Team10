import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { notifyAuthChanged } from "./authEvents";

/**
 * API 베이스 URL 결정 로직
 */
export function resolveApiBaseUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined") {
        const { protocol, hostname } = window.location;
        // 🎯 [수정] localhost 또는 127.0.0.1 접속 시 구글 인증 규격에 맞춰 localhost:8080 반환
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return `${protocol}//localhost:8080/api`;
        }
        // LAN 접속 (192.168.x.x 등) 대응
        return `${protocol}//${hostname}:8080/api`;
    }

    // SSR 또는 기본값
    return "http://localhost:8080/api";
}

const api: AxiosInstance = axios.create();

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 인터셉터에서 매번 URL을 결정하므로 동적 대응 가능
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
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                notifyAuthChanged();
            }
        }
        return Promise.reject(error);
    },
);

export default api;