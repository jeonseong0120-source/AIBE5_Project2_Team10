package com.devnear.web.controller.project;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.project.ProposalInquiryResponse;
import com.devnear.web.service.project.ProjectProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Project proposal", description = "클라이언트 → 프리랜서 프로젝트 제안")
@RestController
@RequestMapping(value = {"/api/project-proposals", "/api/v1/project-proposals"})
@RequiredArgsConstructor
public class ProjectProposalController {

    private final ProjectProposalService projectProposalService;

    @Operation(summary = "제안 수락", description = "프리랜서가 대기 중인 제안을 수락합니다. 채팅방에 시스템 메시지가 전송됩니다.")
    @PatchMapping("/{proposalId}/accept")
    public ResponseEntity<Void> accept(
            @AuthenticationPrincipal User user,
            @PathVariable Long proposalId
    ) {
        projectProposalService.acceptProposal(user, proposalId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "제안 거절", description = "프리랜서가 대기 중인 제안을 거절합니다. 채팅방에 시스템 메시지가 전송됩니다.")
    @PatchMapping("/{proposalId}/reject")
    public ResponseEntity<Void> reject(
            @AuthenticationPrincipal User user,
            @PathVariable Long proposalId
    ) {
        projectProposalService.rejectProposal(user, proposalId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "문의하기(채팅방)", description = "클라이언트와의 프로젝트 채팅방을 조회하거나 생성하고 채팅방 ID를 반환합니다.")
    @PostMapping("/{proposalId}/inquire")
    public ResponseEntity<ProposalInquiryResponse> inquire(
            @AuthenticationPrincipal User user,
            @PathVariable Long proposalId
    ) {
        Long roomId = projectProposalService.inquireChatRoom(user, proposalId);
        return ResponseEntity.ok(new ProposalInquiryResponse(roomId));
    }
}
