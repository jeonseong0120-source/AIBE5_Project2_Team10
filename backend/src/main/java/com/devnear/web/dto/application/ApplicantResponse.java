package com.devnear.web.dto.application;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.dto.skill.SkillResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [CLI] 클라이언트가 자신의 프로젝트 지원자를 조회할 때 사용하는 응답 DTO입니다.
 */
@Getter
@Builder
public class ApplicantResponse {

    private Long applicationId;
    private Long proposalId;
    private String source; // "APPLICATION" or "PROPOSAL"
    private com.devnear.web.domain.enums.ApplicationStatus status;
    private Double matchingRate;
    private Integer bidPrice;
    private String message;
    private LocalDateTime appliedAt;

    private Long freelancerId;
    private String freelancerNickname;
    private String freelancerProfileImageUrl;
    private List<SkillResponse> freelancerSkills;

    public static ApplicantResponse from(ProjectApplication app) {
        List<SkillResponse> skills = app.getFreelancerProfile().getFreelancerSkills().stream()
                .map(fs -> SkillResponse.from(fs.getSkill()))
                .toList();

        return ApplicantResponse.builder()
                .applicationId(app.getId())
                .source("APPLICATION")
                .status(app.getStatus())
                .matchingRate(app.getMatchingRate())
                .bidPrice(app.getBidPrice())
                .message(app.getMessage())
                .appliedAt(app.getCreatedAt())
                .freelancerId(app.getFreelancerProfile().getId())
                .freelancerNickname(app.getFreelancerProfile().getUser().getNickname())
                .freelancerProfileImageUrl(app.getFreelancerProfile().getUser().getProfileImageUrl())
                .freelancerSkills(skills)
                .build();
    }

    public static ApplicantResponse from(com.devnear.web.domain.proposal.Proposal proposal) {
        List<SkillResponse> skills = proposal.getFreelancerProfile().getFreelancerSkills().stream()
                .map(fs -> SkillResponse.from(fs.getSkill()))
                .toList();

        // 역제안은 명시적 매칭률 필드가 없을 수 있으므로 100% 혹은 계산된 값(필요시)을 넣습니다.
        // 여기선 단순화하여 100% 또는 0으로 처리하거나, 프로젝트-프리랜서 기술 스택 비교 로직을 태울 수 있습니다.
        return ApplicantResponse.builder()
                .applicationId(proposal.getId()) // Populate applicationId for stable key in UI
                .proposalId(proposal.getId())
                .source("PROPOSAL")
                .status(com.devnear.web.domain.enums.ApplicationStatus.valueOf(proposal.getStatus().name()))
                .matchingRate(100.0) // 역제안은 클라이언트가 직접 뽑은 것이므로 기본 100으로 표시
                .bidPrice(proposal.getOfferedPrice())
                .message(proposal.getMessage())
                .appliedAt(proposal.getCreatedAt())
                .freelancerId(proposal.getFreelancerProfile().getId())
                .freelancerNickname(proposal.getFreelancerProfile().getUser().getNickname())
                .freelancerProfileImageUrl(proposal.getFreelancerProfile().getUser().getProfileImageUrl())
                .freelancerSkills(skills)
                .build();
    }
}

