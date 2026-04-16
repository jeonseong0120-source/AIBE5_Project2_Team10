package com.devnear.web.dto.proposal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * 프리랜서가 역제안 상태를 변경(수락/거절)할 때 사용하는 요청 DTO
 */
@Getter
public class ProposalStatusUpdateRequest {

    @NotBlank(message = "변경할 상태값을 입력해주세요. (ACCEPTED 또는 REJECTED)")
    @Schema(description = "변경할 상태", example = "ACCEPTED", allowableValues = {"ACCEPTED", "REJECTED"})
    private String status;
}
