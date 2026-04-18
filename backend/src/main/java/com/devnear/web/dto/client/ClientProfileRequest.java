package com.devnear.web.dto.client;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.user.User;
import jakarta.validation.constraints.NotBlank; // 추가 권장
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ClientProfileRequest {

    @NotBlank(message = "업체명은 필수입니다.")
    @Size(max = 100, message = "업체명은 100자 이내여야 합니다.")
    private String companyName;

    // 🔍 [추가] 닉네임을 프론트에서 받아올 수 있도록 필드 추가
    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(max = 50, message = "닉네임은 50자 이내여야 합니다.")
    private String nickname;

    @NotBlank(message = "사업자번호는 필수입니다.")
    @Size(max = 12, message = "사업자번호는 12자 이내여야 합니다.")
    @Pattern(regexp = "^\\d{3}-\\d{2}-\\d{5}$", message = "사업자번호 형식이 올바르지 않습니다. (예: 000-00-00000)")
    private String bn;

    @NotBlank(message = "대표자명은 필수입니다.")
    @Size(max = 50, message = "대표자명은 50자 이내여야 합니다.")
    private String representativeName;

    @Size(max = 500, message = "소개는 500자 이내여야 합니다.")  // 추가
    private String introduction;

    @Size(max = 255, message = "홈페이지 주소는 255자 이내여야 합니다.")
    @Pattern(regexp = "^(https?://).+", message = "홈페이지 주소는 http:// 또는 https://로 시작해야 합니다.")  // 추가
    private String homepageUrl;

    @NotBlank(message = "연락처는 필수입니다.")
    @Size(max = 20, message = "연락처는 20자 이내여야 합니다.")
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)")  // 추가
    private String phoneNum;

    private String logoUrl; // 🔍 로고 URL 필드 추가

    public ClientProfile toEntity(User user) {
        return ClientProfile.builder()
                .user(user)
                .companyName(companyName)
                .bn(bn)
                .representativeName(representativeName)
                .introduction(introduction)
                .homepageUrl(homepageUrl)
                .phoneNum(phoneNum)
                .logoUrl(logoUrl)
                .build();
    }
}