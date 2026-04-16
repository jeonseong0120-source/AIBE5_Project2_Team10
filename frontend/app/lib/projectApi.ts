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
