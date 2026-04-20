package com.devnear.web.dto.ai;

import com.devnear.web.domain.project.Project;

/**
 * 프리랜서–프로젝트 추천 결과.
 * similarityScore 필드는 하위호환을 위해 이름을 유지하며,
 * 실제 값은 태그 유사도 + 평점 보정이 반영된 최종 매칭 점수(0~1)입니다.
 */
public record RecommendedProjectResponse(
        Long projectId,
        String projectName,
        double similarityScore,
        Integer budget
) {
    public static RecommendedProjectResponse of(Project project, double similarityScore) {
        return new RecommendedProjectResponse(
                project.getId(),
                project.getProjectName(),
                similarityScore,
                project.getBudget()
        );
    }
}
