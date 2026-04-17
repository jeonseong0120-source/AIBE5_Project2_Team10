package com.devnear.web.dto.proposal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

/**
 * 클라이언트가 프리랜서에게 역제안을 보낼 때 사용하는 요청 DTO
 */
@Getter
public class ProposalRequest {

    @NotNull(message = "역제안을 연결할 프로젝트 ID를 입력해주세요.")
    @Schema(description = "역제안을 보낼 프로젝트 ID", example = "5")
    private Long projectId;

    @NotNull(message = "역제안을 받을 프리랜서 프로필 ID를 입력해주세요.")
    @Schema(description = "역제안을 받을 프리랜서 프로필 ID", example = "12")
    private Long freelancerProfileId;

    @NotNull(message = "제시 금액을 입력해주세요.")
    @Min(value = 0, message = "금액은 0 이상이어야 합니다.")
    @Schema(description = "클라이언트가 제시하는 금액", example = "800000")
    private Integer offeredPrice;

    @Schema(description = "제안 메시지", example = "저희 프로젝트에 꼭 맞는 분인 것 같아 직접 제안 드립니다.")
    private String message;
}
