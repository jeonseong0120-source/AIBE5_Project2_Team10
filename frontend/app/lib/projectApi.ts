import api from "./axios";

/** POST /api/projects — Spring `ProjectRequest`와 동일한 camelCase 필드명 */
export type CreateProjectBody = {
    projectName: string;
    budget: number;
    /** `YYYY-MM-DD` (LocalDate) */
    deadline: string;
    detail?: string;
    online: boolean;
    offline: boolean;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    skillNames?: string[];
    skillIds?: number[];
};

/**
 * 클라이언트 프로젝트 공고 등록.
 * axios baseURL이 `.../api`이므로 경로는 `/projects` (= `/api/projects`).
 */
export async function createProject(body: CreateProjectBody): Promise<number> {
    const { data } = await api.post<number>("/projects", body);
    if (typeof data !== "number") {
        const n = Number(data);
        if (!Number.isFinite(n)) {
            throw new Error("프로젝트 등록 응답이 올바르지 않습니다.");
        }
        return n;
    }
    return data;
}

/** PUT /api/projects/{projectId} — 프로젝트 공고 수정 */
export async function updateProject(projectId: number | string, body: CreateProjectBody): Promise<void> {
    await api.put(`/projects/${projectId}`, body);
}

// 🎯  매칭 결과 응답 데이터 타입
export interface FreelancerMatch {
    profileId: number;
    nickname: string;
    profileImageUrl: string | null;
    introduction: string;
    averageRating: number;
    completedProjects: number;
    skills: string[];
    isActive: boolean;
    matchingRate: number;
    distance: number;   // 실시간 계산된 거리 (km)
    latitude: number;   // 요원의 위도
    longitude: number;  // 요원의 경도
}

// 🎯 [수정됨] 매칭 결과 API 호출 함수
export async function getMatchingResults(projectId: number | string): Promise<FreelancerMatch[]> {
    // 주의: 백엔드 API 주소에 맞게 baseURL 뒤의 경로를 설정
    const { data } = await api.get<FreelancerMatch[]>(`/v1/matchings/projects/${projectId}?page=0&size=5`);
    return data;
}