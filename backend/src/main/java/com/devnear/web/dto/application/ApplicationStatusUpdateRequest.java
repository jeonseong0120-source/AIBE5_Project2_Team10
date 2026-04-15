package com.devnear.web.dto.application;

import com.devnear.web.domain.enums.ApplicationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * [CLI] 지원 상태를 수락/거절로 변경할 때 사용하는 요청 DTO입니다.
 */
@Getter
public class ApplicationStatusUpdateRequest {

    @NotBlank(message = "status는 필수입니다. (ACCEPTED 또는 REJECTED)")
    @Schema(
            description = "변경할 지원 상태 (ACCEPTED 또는 REJECTED만 허용)",
            example = "ACCEPTED",
            allowableValues = {"ACCEPTED", "REJECTED"}
    )
    private String status;

    public ApplicationStatus toStatus() {
        try {
            return ApplicationStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("status 값이 올바르지 않습니다. (ACCEPTED 또는 REJECTED)");
        }
    }
}

