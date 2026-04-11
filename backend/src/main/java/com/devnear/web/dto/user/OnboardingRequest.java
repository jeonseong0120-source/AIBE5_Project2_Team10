package com.devnear.web.dto.user;

import com.devnear.web.domain.enums.Role;
import com.devnear.web.dto.client.ClientProfileRequest;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OnboardingRequest {
    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(max = 20, message = "닉네임은 20자 이내여야 합니다.")
    private String nickname;

    @NotNull(message = "역할 선택은 필수입니다.")
    private Role role;

    // [보고] 역할이 CLIENT나 BOTH일 경우 필수입니다.
    @Valid
    private ClientProfileRequest clientProfile;

    // [보고] 역할이 FREELANCER나 BOTH일 경우 필수입니다.
    @Valid
    private FreelancerProfileRequest freelancerProfile;
}
