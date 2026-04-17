package com.devnear.web.service.proposal;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.Proposal;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.proposal.ProposalRequest;
import com.devnear.web.dto.proposal.ProposalStatusUpdateRequest;
import com.devnear.web.dto.proposal.ReceivedProposalResponse;
import com.devnear.web.dto.proposal.SentProposalResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.OptimisticLockException;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ChatService chatService;

    /**
     * [CLI] 클라이언트가 특정 프리랜서에게 역제안을 전송합니다.
     */
    @Transactional
    public Long sendProposal(User user, ProposalRequest request) {
        // 1. 클라이언트 프로필 조회
        ClientProfile clientProfile = clientProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("클라이언트 프로필이 등록되어 있지 않습니다."));

        // 2. 프로젝트 존재 및 소유권 확인
        Project project = projectRepository.findByIdWithClientProfile(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("본인 소유의 프로젝트에만 역제안을 보낼 수 있습니다.");
        }

        // 3. 프리랜서 프로필 조회
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findById(request.getFreelancerProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("해당 프리랜서를 찾을 수 없습니다."));

        // 4. 중복 제안 방지
        if (proposalRepository.existsByProjectIdAndFreelancerProfileId(
                request.getProjectId(), request.getFreelancerProfileId())) {
            throw new IllegalArgumentException("해당 프리랜서에게 이미 역제안을 보냈습니다. (ALREADY_PROPOSED)");
        }

        // 5. 역제안 생성 및 저장
        Proposal proposal = Proposal.builder()
                .project(project)
                .clientProfile(clientProfile)
                .freelancerProfile(freelancerProfile)
                .message(request.getMessage())
                .offeredPrice(request.getOfferedPrice())
                .build();

        try {
            return proposalRepository.saveAndFlush(proposal).getId();
        } catch (DataIntegrityViolationException e) {
            if (e.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
                org.hibernate.exception.ConstraintViolationException hibernateException =
                        (org.hibernate.exception.ConstraintViolationException) e.getCause();
                String constraintName = hibernateException.getConstraintName();
                if (constraintName != null && constraintName.toUpperCase().contains("UK_PROPOSAL")) {
                    throw new IllegalArgumentException("해당 프리랜서에게 이미 역제안을 보냈습니다. (ALREADY_PROPOSED)");
                }
            }
            // UK_PROPOSAL 제약조건 위반이 아니라면 원본 예외 던지기
            throw e;
        }
    }

    /**
     * [CLI] 클라이언트가 자신이 보낸 역제안 목록을 조회합니다.
     */
    public List<SentProposalResponse> getSentProposals(User user) {
        ClientProfile clientProfile = clientProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("클라이언트 프로필이 등록되어 있지 않습니다."));

        return proposalRepository.findSentProposalsByClientId(clientProfile.getId()).stream()
                .map(SentProposalResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * [FRE] 프리랜서가 자신이 받은 역제안 목록을 조회합니다.
     */
    public List<ReceivedProposalResponse> getReceivedProposals(User user) {
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프리랜서 프로필이 등록되어 있지 않습니다."));

        return proposalRepository.findReceivedProposalsByFreelancerId(freelancerProfile.getId()).stream()
                .map(ReceivedProposalResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * [FRE] 프리랜서가 받은 역제안을 수락 또는 거절합니다.
     */
    @Transactional
    public void respondToProposal(User user, Long proposalId, ProposalStatusUpdateRequest request) {
        ProposalStatus newStatus;
        if (request == null || request.getStatus() == null || request.getStatus().isBlank()) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다. ACCEPTED 또는 REJECTED만 가능합니다.");
        }

        try {
            String normalizedStatus = request.getStatus().trim().toUpperCase(Locale.ROOT);
            newStatus = ProposalStatus.valueOf(normalizedStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다. ACCEPTED 또는 REJECTED만 가능합니다.");
        }

        if (newStatus != ProposalStatus.ACCEPTED && newStatus != ProposalStatus.REJECTED) {
            throw new IllegalArgumentException("제안 상태는 ACCEPTED 또는 REJECTED만 가능합니다.");
        }

        Proposal proposal;
        try {
            proposal = proposalRepository.findByIdWithFreelancer(proposalId)
                    .orElseThrow(() -> new ResourceNotFoundException("역제안을 찾을 수 없습니다. id=" + proposalId));
        } catch (PessimisticLockingFailureException e) {
            // 비관적 락 획득 실패 (다른 트랜잭션이 이미 쓰고 있는 중)
            throw new IllegalStateException("동시 요청으로 인해 처리에 실패했습니다. 다시 시도해주세요.");
        }

        // 본인에게 온 제안인지 확인
        if (!proposal.getFreelancerProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 역제안에 대한 권한이 없습니다.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 역제안입니다.");
        }

        try {
            proposal.updateStatus(newStatus);
            proposalRepository.flush(); // 강제 플러시로 트랜잭션 종료 전 버전 체크 즉시 수행
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException e) {
            // 동시 요청으로 version 충돌 발생
            throw new ResourceConflictException("동시 요청으로 인해 처리에 실패했습니다. 다시 시도해주세요.");
        }
    }

    /**
     * [FRE] 프리랜서가 받은 역제안에서 문의하기를 눌렀을 때
     * 클라이언트-프리랜서 채팅방을 조회/생성하고 roomId를 반환합니다.
     */
    @Transactional
    public Long inquireChatRoom(User user, Long proposalId) {
        Proposal proposal = proposalRepository.findByIdForInquiry(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("역제안을 찾을 수 없습니다. id=" + proposalId));

        if (!proposal.getFreelancerProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 역제안에 대한 권한이 없습니다.");
        }

        return chatService.getOrCreateRoomForProjectClientAndFreelancer(
                user,
                proposal.getProject(),
                proposal.getClientProfile().getUser(),
                proposal.getFreelancerProfile().getUser()
        ).getRoomId();
    }
}
