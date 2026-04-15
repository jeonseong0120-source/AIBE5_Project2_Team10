package com.devnear.web.dto.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

/**
 * 프론트엔드에서 넘어오는 프로젝트 지원서 제출 데이터입니다.
 */
@Getter
public class ApplicationRequest {

    @NotNull(message = "지원할 프로젝트 ID를 입력해주세요.")
    @Schema(description = "지원할 프로젝트 ID", example = "10")
    private Long projectId;

    @NotNull(message = "본인의 희망 페이(단가)를 입력해주세요.")
    @Min(value = 0, message = "금액은 0 이상이어야 합니다.")
    @Schema(description = "지원 희망 단가", example = "700000")
    private Integer bidPrice;

    @Schema(description = "지원 메시지", example = "백엔드 실무 경험 3년으로 빠르게 기여하겠습니다.")
    private String message; // 지원 메시지
}
