package com.devnear.web.dto.project;

import com.devnear.web.domain.project.Project;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class ProjectResponse {
    private Long projectId;
    private String companyName; // 작성자(업체)명
    private String projectName;
    private Integer budget;
    private LocalDate deadline;
    private String detail;
    private String status;
    private boolean online;
    private boolean offline;
    private String location;
    private Double latitude;
    private Double longitude;
    private String logoUrl; // 클라이언트 로고 URL
    private List<String> skills; // 연결된 기술 스택 이름 목록
    private Long applicationCount; // 지원자 수
    private Long clientUserId; // 문의 대상(클라이언트) userId 추가
    private boolean bookmarked; // 현재 사용자가 찜했는지 여부

    public static ProjectResponse from(Project project) {
        return from(project, null, false);
    }

    public static ProjectResponse from(Project project, Long applicationCount) {
        return from(project, applicationCount, false);
    }

    public static ProjectResponse from(Project project, Long applicationCount, boolean bookmarked) {
        return ProjectResponse.builder()
                .projectId(project.getId())
                .companyName(project.getClientProfile().getCompanyName())
                .logoUrl(project.getClientProfile().getLogoUrl())
                .projectName(project.getProjectName())
                .budget(project.getBudget())
                .deadline(project.getDeadline())
                .detail(project.getDetail())
                .status(project.getStatus().name())
                .online(project.isOnline())
                .offline(project.isOffline())
                .location(project.getLocation())
                .latitude(project.getLatitude())
                .longitude(project.getLongitude())
                .skills(project.getProjectSkills().stream()
                        .map(ps -> ps.getSkill().getName())
                        .collect(Collectors.toList()))
                .applicationCount(applicationCount)
                .clientUserId(
                        project.getClientProfile() != null &&
                                project.getClientProfile().getUser() != null
                                ? project.getClientProfile().getUser().getId()
                                : null
                )
                .bookmarked(bookmarked)
                .build();
    }
}