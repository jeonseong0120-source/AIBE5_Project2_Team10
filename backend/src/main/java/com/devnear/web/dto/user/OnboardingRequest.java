package com.devnear.web.dto.user;

import com.devnear.web.domain.enums.Role;
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
}