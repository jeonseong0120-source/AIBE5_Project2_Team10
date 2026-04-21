import api from "./axios";

/** POST /api/projects — Spring ProjectRequest와 동일한 camelCase 필드명 */
export type CreateProjectBody = {
    projectName: string;
    budget: number;
    /** YYYY-MM-DD (LocalDate) */
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

// 🎯 매칭 결과 응답 데이터 타입 (Non-nullable 유지)
export interface FreelancerMatch {
    profileId: number;
    nickname: string;
    profileImageUrl: string | null; // 이미지 주소는 명시적으로 null 허용
    introduction: string;
    averageRating: number;
    completedProjects: number;
    skills: string[];
    isActive: boolean;
    matchingRate: number;
    distance: number;
    latitude: number;
    longitude: number;
}

// 🎯 [수정 완료] 매칭 결과 API 호출 및 데이터 정규화
export async function getMatchingResults(projectId: number | string): Promise<FreelancerMatch[]> {
    const { data } = await api.get<FreelancerMatch[]>(`/v1/matchings/projects/${projectId}?page=0&size=5`);

    // ✅ 백엔드 null 응답에 대비한 기본값 매핑 로직 추가
    return (data || []).map((item) => ({
        ...item,
        introduction: item.introduction ?? "",
        averageRating: item.averageRating ?? 0,
        completedProjects: item.completedProjects ?? 0,
        skills: item.skills ?? [],
        isActive: item.isActive ?? false,
        distance: item.distance ?? 0,
        latitude: item.latitude ?? 0,
        longitude: item.longitude ?? 0,
    }));
}