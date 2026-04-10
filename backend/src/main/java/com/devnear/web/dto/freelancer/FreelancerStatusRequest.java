package com.devnear.web.dto.freelancer;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class FreelancerStatusRequest {
    @NotNull(message = "활동 상태값(isActive)은 필수 입력 항목입니다.")
    private Boolean isActive;
}
