package com.devnear.web.dto.ai;

import com.devnear.web.domain.project.Project;

/**
 * 프리랜서–프로젝트 텍스트 유사도 기반 추천 결과.
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
