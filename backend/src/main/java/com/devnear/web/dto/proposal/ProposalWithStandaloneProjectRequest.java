package com.devnear.web.dto.proposal;

import com.devnear.web.dto.project.ProjectRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 제안서(FORM) 흐름에서 프로젝트 생성과 역제안 전송을 한 트랜잭션으로 처리할 때 사용합니다.
 */
@Getter
@Setter
@NoArgsConstructor
public class ProposalWithStandaloneProjectRequest {

    @NotNull(message = "프로젝트 정보는 필수입니다.")
    @Valid
    @Schema(description = "함께 생성할 프로젝트 공고")
    private ProjectRequest project;

    @NotNull(message = "역제안을 받을 프리랜서 프로필 ID를 입력해주세요.")
    @Schema(description = "역제안을 받을 프리랜서 프로필 ID", example = "12")
    private Long freelancerProfileId;

    @NotNull(message = "제시 금액을 입력해주세요.")
    @Min(value = 0, message = "금액은 0 이상이어야 합니다.")
    @Schema(description = "클라이언트가 제시하는 금액", example = "800000")
    private Integer offeredPrice;

    @Schema(description = "제안 메시지")
    private String message;
}
