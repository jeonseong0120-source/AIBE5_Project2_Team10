package com.devnear.web.dto.freelancer;

import com.devnear.web.domain.enums.WorkStyle;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.dto.skill.SkillResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class FreelancerProfileResponse {

    private Long profileId;
    private Long userId;
    private String userName;
    private String profileImageUrl;
    private List<String> portfolioImageUrls;
    private String introduction;
    private String location;
    private Double latitude;
    private Double longitude;
    private Integer hourlyRate;
    private WorkStyle workStyle;
    private Boolean isActive;
    private String gradeName;
    private Double averageRating;
    private Integer reviewCount;
    private Integer completedProjects;
    private List<SkillResponse> skills;

    public static FreelancerProfileResponse from(FreelancerProfile profile) {
        return from(profile, Collections.emptyList());
    }

    public static FreelancerProfileResponse from(FreelancerProfile profile, List<String> portfolioImageUrls) {
        String gradeName = (profile.getGrade() != null) ? profile.getGrade().getName() : null;
        
        List<SkillResponse> skillResponses = profile.getFreelancerSkills().stream()
                .map(freelancerSkill -> SkillResponse.from(freelancerSkill.getSkill()))
                .collect(Collectors.toList());

        return FreelancerProfileResponse.builder()
                .profileId(profile.getId())
                .userId(profile.getUser().getId())
                .userName(profile.getUser().getNickname())
                // User 테이블 프사가 아닌 Profile 테이블 전용 프사 우선 반환 (없으면 본계정 프사)
                .profileImageUrl(profile.getProfileImageUrl() != null ? profile.getProfileImageUrl() : profile.getUser().getProfileImageUrl())
                .portfolioImageUrls(portfolioImageUrls != null ? portfolioImageUrls : Collections.emptyList())
                .introduction(profile.getIntroduction())
                .location(profile.getLocation())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .hourlyRate(profile.getHourlyRate())
                .workStyle(profile.getWorkStyle())
                .isActive(profile.getIsActive())
                .gradeName(gradeName)
                .averageRating(profile.getAverageRating())
                .reviewCount(profile.getReviewCount())
                .completedProjects(profile.getCompletedProjects())
                .skills(skillResponses)
                .build();
    }
}
