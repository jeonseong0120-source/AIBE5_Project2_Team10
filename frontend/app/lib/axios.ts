import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// 1. Axios 인스턴스 생성 (타입 지정으로 any 탈출)
const api: AxiosInstance = axios.create({
    baseURL: "http://localhost:8080/api",
});

// 2. 요청(Request) 인터셉터 설정
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 브라우저 환경에서만 localStorage에 접근 (Next.js SSR 방어)
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                // 규격에 맞게 Authorization 헤더 추가
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: unknown) => {
        // 에러 타입을 unknown 또는 Error로 지정하여 TS7006 방지
        return Promise.reject(error);
    }
);
// 3. 응답(Response) 인터셉터 추가
api.interceptors.response.use(
    (response) => response, // 성공하면 그대로 통과
    (error) => {
        // [보고] 401 에러(인증 만료/실패)가 나면 토큰을 비우고 로그인으로 배송
        if (error.response && error.response.status === 401) {
            console.log("세션이 만료되었습니다. 다시 로그인해주세요.");
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                // 필요한 경우 여기서 window.location.href = "/login" 등으로 강제 이동
            }
        }
        return Promise.reject(error);
    }
);

export default api;