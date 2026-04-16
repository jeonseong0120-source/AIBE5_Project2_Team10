package com.devnear.web.dto.proposal;

import com.devnear.web.domain.proposal.Proposal;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 클라이언트가 보낸 역제안 목록 조회용 응답 DTO
 */
@Getter
public class SentProposalResponse {

    @Schema(description = "역제안 ID")
    private final Long proposalId;

    @Schema(description = "연결된 프로젝트 ID")
    private final Long projectId;

    @Schema(description = "프로젝트명")
    private final String projectName;

    @Schema(description = "제안 받은 프리랜서 프로필 ID")
    private final Long freelancerProfileId;

    @Schema(description = "제안 받은 프리랜서 이름")
    private final String freelancerName;

    @Schema(description = "제시 금액")
    private final Integer offeredPrice;

    @Schema(description = "제안 메시지")
    private final String message;

    @Schema(description = "제안 상태 (PENDING/ACCEPTED/REJECTED)")
    private final String status;

    @Schema(description = "제안 상태 한글 설명")
    private final String statusDescription;

    @Schema(description = "제안 생성일시")
    private final LocalDateTime createdAt;

    private SentProposalResponse(Proposal proposal) {
        this.proposalId = proposal.getId();
        this.projectId = proposal.getProject().getId();
        this.projectName = proposal.getProject().getProjectName();
        this.freelancerProfileId = proposal.getFreelancerProfile().getId();
        this.freelancerName = proposal.getFreelancerProfile().getUser().getName();
        this.offeredPrice = proposal.getOfferedPrice();
        this.message = proposal.getMessage();
        this.status = proposal.getStatus().name();
        this.statusDescription = proposal.getStatus().getDescription();
        this.createdAt = proposal.getCreatedAt();
    }

    public static SentProposalResponse from(Proposal proposal) {
        return new SentProposalResponse(proposal);
    }
}
