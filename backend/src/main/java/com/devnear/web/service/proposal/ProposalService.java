package com.devnear.web.service.proposal;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.ProjectStatus;
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
import com.devnear.web.dto.proposal.ProposalWithStandaloneProjectRequest;
import com.devnear.web.dto.proposal.ReceivedProposalResponse;
import com.devnear.web.dto.proposal.SentProposalResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.service.chat.ChatService;
import com.devnear.web.service.notification.NotificationService;
import com.devnear.web.service.project.ProjectDeadlineAutoCloseService;
import com.devnear.web.service.project.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.OptimisticLockException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProposalService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final ProposalRepository proposalRepository;
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final ProjectService projectService;
    private final ProjectDeadlineAutoCloseService projectDeadlineAutoCloseService;

    /**
     * [CLI] 클라이언트가 특정 프리랜서에게 역제안을 전송합니다.
     */
    @Transactional
    public Long sendProposal(User user, ProposalRequest request) {
        ClientProfile clientProfile = clientProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("클라이언트 프로필이 등록되어 있지 않습니다."));

        Project project = projectRepository.findByIdWithClientProfile(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("본인 소유의 프로젝트에만 역제안을 보낼 수 있습니다.");
        }

        return sendProposalCore(
                clientProfile,
                project,
                request.getFreelancerProfileId(),
                request.getOfferedPrice(),
                request.getMessage()
        );
    }

    /**
     * [CLI] 제안서(FORM) 전용: 프로젝트 생성과 역제안을 한 트랜잭션에서 처리합니다.
     * 제안 전송 실패 시 고아 프로젝트가 남지 않습니다.
     */
    @Transactional
    public Long sendProposalWithStandaloneProject(User user, ProposalWithStandaloneProjectRequest request) {
        ClientProfile clientProfile = clientProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("클라이언트 프로필이 등록되어 있지 않습니다."));

        Long projectId = projectService.createProjectForProposalStandalone(user, request.getProject());
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("본인 소유의 프로젝트에만 역제안을 보낼 수 있습니다.");
        }

        return sendProposalCore(
                clientProfile,
                project,
                request.getFreelancerProfileId(),
                request.getOfferedPrice(),
                request.getMessage()
        );
    }

    private Long sendProposalCore(
            ClientProfile clientProfile,
            Project project,
            Long freelancerProfileId,
            Integer offeredPrice,
            String message
    ) {
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findById(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 프리랜서를 찾을 수 없습니다."));

        LocalDate today = LocalDate.now(KST);
        if (project.getDeadline().isBefore(today)) {
            throw new IllegalStateException("마감일이 지난 공고에는 역제안을 보낼 수 없습니다.");
        }

        if (proposalRepository.existsByProjectIdAndFreelancerProfileId(project.getId(), freelancerProfileId)) {
            throw new IllegalArgumentException("해당 프리랜서에게 이미 역제안을 보냈습니다. (ALREADY_PROPOSED)");
        }

        Proposal proposal = Proposal.builder()
                .project(project)
                .clientProfile(clientProfile)
                .freelancerProfile(freelancerProfile)
                .message(message)
                .offeredPrice(offeredPrice)
                .build();

        try {
            Long proposalId = proposalRepository.saveAndFlush(proposal).getId();
            notificationService.notifyUser(
                    freelancerProfile.getUser().getId(),
                    NotificationType.PROJECT_PROPOSAL_SENT,
                    "새 역제안 도착",
                    clientProfile.getUser().getNickname() + " 님이 '" + project.getProjectName() + "' 역제안을 보냈습니다.",
                    proposalId
            );
            return proposalId;
        } catch (DataIntegrityViolationException e) {
            if (e.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
                org.hibernate.exception.ConstraintViolationException hibernateException =
                        (org.hibernate.exception.ConstraintViolationException) e.getCause();
                String constraintName = hibernateException.getConstraintName();
                if (constraintName != null && constraintName.toUpperCase().contains("UK_PROPOSAL")) {
                    throw new IllegalArgumentException("해당 프리랜서에게 이미 역제안을 보냈습니다. (ALREADY_PROPOSED)");
                }
            }
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
            if (newStatus == ProposalStatus.ACCEPTED) {
                // 프로젝트 행 비관적 락: 동일 프로젝트에 대한 역제안 수락 경쟁 시 한 건만 성공하도록 직렬화
                Project project;
                try {
                    project = projectRepository.findByIdForUpdate(proposal.getProject().getId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "프로젝트를 찾을 수 없습니다. id=" + proposal.getProject().getId()));
                } catch (PessimisticLockingFailureException e) {
                    throw new ResourceConflictException("동시 요청으로 인해 처리에 실패했습니다. 다시 시도해주세요.");
                }

                if (project.getStatus() != ProjectStatus.OPEN) {
                    throw new ResourceConflictException("이미 진행 중이거나 종료되어 역제안을 수락할 수 없습니다.");
                }
                if (project.getFreelancerProfile() != null
                        && !project.getFreelancerProfile().getId().equals(proposal.getFreelancerProfile().getId())) {
                    throw new ResourceConflictException("이미 다른 프리랜서가 매칭된 프로젝트입니다.");
                }

                proposal.updateStatus(newStatus);
                project.assignFreelancer(proposal.getFreelancerProfile());
            } else {
                proposal.updateStatus(newStatus);
            }
            proposalRepository.flush(); // 강제 플러시로 트랜잭션 종료 전 Proposal/Project 버전 체크 즉시 수행
            Long clientUserId = proposal.getClientProfile().getUser().getId();
            if (newStatus == ProposalStatus.ACCEPTED) {
                notificationService.notifyUser(
                        clientUserId,
                        NotificationType.PROJECT_PROPOSAL_ACCEPTED,
                        "역제안 수락",
                        "'" + proposal.getProject().getProjectName() + "' 역제안이 수락되었습니다.",
                        proposal.getId()
                );
            } else {
                notificationService.notifyUser(
                        clientUserId,
                        NotificationType.PROJECT_PROPOSAL_REJECTED,
                        "역제안 거절",
                        "'" + proposal.getProject().getProjectName() + "' 역제안이 거절되었습니다.",
                        proposal.getId()
                );
            }
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException e) {
            // 동시 요청으로 version 충돌 발생
            throw new ResourceConflictException("동시 요청으로 인해 처리에 실패했습니다. 다시 시도해주세요.");
        }

        projectDeadlineAutoCloseService.tryAutoCloseIfReady(proposal.getProject().getId());
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
