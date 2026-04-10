package com.devnear.web.dto.project;

import com.devnear.web.domain.project.Project;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

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

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .projectId(project.getId())
                .companyName(project.getClientProfile().getCompanyName())
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
                .build();
    }
}