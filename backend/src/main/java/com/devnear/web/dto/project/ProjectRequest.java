package com.devnear.web.dto.project;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.project.Project;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
public class ProjectRequest {
    private static final int MAX_PROJECT_SKILLS = 10;

    @NotBlank(message = "프로젝트 명은 필수입니다.")
    @Size(max = 100)
    private String projectName;

    @NotNull(message = "예산은 필수입니다.")
    @Positive(message = "예산은 0보다 커야 합니다.")
    private Integer budget;

    @NotNull(message = "마감기한은 필수입니다.")
    @Future(message = "마감기한은 오늘 이후여야 합니다.")
    private LocalDate deadline;

    private String detail;
    private boolean online;
    private boolean offline;

    @Size(max = 500, message = "주소는 500자를 초과할 수 없습니다.")
    private String location;

    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    private Double longitude;

    @JsonAlias({"skills", "projectSkills"})
    @Size(max = MAX_PROJECT_SKILLS, message = "프로젝트 스킬은 최대 10개까지 지정할 수 있습니다.")
    private List<String> skillNames;

    @JsonAlias({"skillIds"})
    @Size(max = MAX_PROJECT_SKILLS, message = "프로젝트 스킬은 최대 10개까지 지정할 수 있습니다.")
    private List<Long> skillIds; // 숫자 ID 기반 입력 호환용

    @AssertTrue(message = "프로젝트 스킬은 최대 10개까지 지정할 수 있습니다.")
    private boolean isTotalSkillPayloadSizeValid() {
        long idCount = skillIds == null
                ? 0
                : skillIds.stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .count();

        long nameCount = skillNames == null
                ? 0
                : skillNames.stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(name -> !name.isEmpty())
                        .distinct()
                        .count();

        return idCount + nameCount <= MAX_PROJECT_SKILLS;
    }

    @AssertTrue(message = "오프라인 프로젝트는 주소 정보가 필수입니다.")
    private boolean isOfflineLocationValid() {
        if (!offline) {
            return true;
        }

        return location != null && !location.trim().isEmpty()
                && latitude != null && longitude != null
                && latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0;
    }

    public Project toEntity(ClientProfile clientProfile) {
        return toEntity(clientProfile, ProjectListingKind.MARKETPLACE);
    }

    public Project toEntity(ClientProfile clientProfile, ProjectListingKind listingKind) {
        return Project.builder()
                .clientProfile(clientProfile)
                .projectName(projectName)
                .budget(budget)
                .deadline(deadline)
                .detail(detail)
                .online(online)
                .offline(offline)
                .location(location)
                .latitude(latitude)
                .longitude(longitude)
                .listingKind(listingKind)
                .build();
    }

    public boolean hasSkillPayload() {
        return skillNames != null || skillIds != null;
    }
}
