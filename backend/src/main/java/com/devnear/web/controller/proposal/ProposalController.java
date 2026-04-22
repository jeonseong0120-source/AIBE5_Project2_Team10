package com.devnear.web.controller.proposal;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.proposal.ProposalInquiryResponse;
import com.devnear.web.dto.proposal.ProposalRequest;
import com.devnear.web.dto.proposal.ProposalWithStandaloneProjectRequest;
import com.devnear.web.dto.proposal.ProposalStatusUpdateRequest;
import com.devnear.web.dto.proposal.ReceivedProposalResponse;
import com.devnear.web.dto.proposal.SentProposalResponse;
import com.devnear.web.service.proposal.ProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Proposal", description = "역제안(클라이언트→프리랜서 스카우트) API")
@RestController
@RequestMapping(value = {"/api/proposals", "/api/v1/proposals"})
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    /**
     * [CLI] 클라이언트가 프리랜서에게 역제안을 전송합니다.
     */
    @Operation(summary = "역제안 전송", description = "클라이언트가 특정 프리랜서에게 역제안(스카우트)을 보냅니다.")
    @PostMapping
    public ResponseEntity<Map<String, Long>> sendProposal(
            @LoginUser User user,
            @Valid @RequestBody ProposalRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Long proposalId = proposalService.sendProposal(user, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", proposalId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * [CLI] 제안서(FORM)용: 프로젝트 생성과 역제안을 한 트랜잭션으로 처리합니다.
     */
    @Operation(summary = "역제안 전송(제안서 전용 프로젝트 동시 생성)", description = "프로젝트 공고를 생성하고 같은 요청에서 역제안을 보냅니다.")
    @PostMapping("/with-standalone-project")
    public ResponseEntity<Map<String, Long>> sendProposalWithStandaloneProject(
            @LoginUser User user,
            @Valid @RequestBody ProposalWithStandaloneProjectRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Long proposalId = proposalService.sendProposalWithStandaloneProject(user, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", proposalId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * [CLI] 클라이언트가 자신이 보낸 역제안 목록을 조회합니다.
     */
    @Operation(summary = "보낸 역제안 목록 조회", description = "클라이언트가 자신이 보낸 역제안 목록을 최신순으로 조회합니다.")
    @GetMapping("/sent")
    public ResponseEntity<List<SentProposalResponse>> getSentProposals(
            @LoginUser User user) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<SentProposalResponse> proposals = proposalService.getSentProposals(user);
        return ResponseEntity.ok(proposals);
    }

    /**
     * [FRE] 프리랜서가 자신이 받은 역제안 목록을 조회합니다.
     */
    @Operation(summary = "받은 역제안 목록 조회", description = "프리랜서가 자신이 받은 역제안 목록을 최신순으로 조회합니다.")
    @GetMapping("/received")
    public ResponseEntity<List<ReceivedProposalResponse>> getReceivedProposals(
            @LoginUser User user) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<ReceivedProposalResponse> proposals = proposalService.getReceivedProposals(user);
        return ResponseEntity.ok(proposals);
    }

    /**
     * [FRE] 프리랜서가 받은 역제안을 수락 또는 거절합니다.
     */
    @Operation(summary = "역제안 수락/거절", description = "프리랜서가 받은 역제안을 ACCEPTED 또는 REJECTED로 변경합니다.")
    @PatchMapping("/{proposalId}/status")
    public ResponseEntity<Void> respondToProposal(
            @LoginUser User user,
            @PathVariable Long proposalId,
            @Valid @RequestBody ProposalStatusUpdateRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            proposalService.respondToProposal(user, proposalId, request);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IllegalStateException e) {
            // 이미 처리된 역제안에 대한 중복 응답 시도 → 409 CONFLICT
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @Operation(summary = "역제안 문의하기", description = "프리랜서가 받은 역제안 기준으로 채팅방을 조회하거나 생성합니다.")
    @PostMapping("/{proposalId}/inquire")
    public ResponseEntity<ProposalInquiryResponse> inquire(
            @LoginUser User user,
            @PathVariable Long proposalId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Long roomId = proposalService.inquireChatRoom(user, proposalId);
        return ResponseEntity.ok(new ProposalInquiryResponse(roomId));
    }
}
