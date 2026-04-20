package com.devnear.web.dto.client;

import com.devnear.web.domain.client.ClientProfile;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClientProfileResponse {
    private Long clientId;
    private String email;
    private String nickname;
    private String companyName;
    private String bn;
    private String representativeName;
    private String introduction;
    private String homepageUrl;
    private String phoneNum;
    private String verificationStatus;
    private Integer totalProjects;
    private Double rating;
    private String logoUrl; // 🔍 로고 URL 필드 추가
    private String grade; // 🔍 등급 필드 추가

    public static ClientProfileResponse from(ClientProfile profile) {
        double safeRating = (profile.getRating() != null)
                ? profile.getRating().doubleValue()
                : 0.0;

        return ClientProfileResponse.builder()
                .clientId(profile.getId())
                .email(profile.getUser().getEmail())
                .nickname(profile.getUser().getNickname())
                .companyName(profile.getCompanyName())
                .bn(profile.getBn())
                .representativeName(profile.getRepresentativeName())
                .introduction(profile.getIntroduction())
                .homepageUrl(profile.getHomepageUrl())
                .phoneNum(profile.getPhoneNum())
                .verificationStatus(profile.getVerificationStatus().name())
                .totalProjects(profile.getTotalProjects())
                .rating(safeRating)
                .logoUrl(profile.getLogoUrl()) // 🔍 추가
                .grade(profile.getGrade().name()) // 🔍 추가
                .build();
    }
}