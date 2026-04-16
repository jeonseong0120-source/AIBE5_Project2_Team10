package com.devnear.web.service.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectProposalStatus;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectProposal;
import com.devnear.web.domain.project.ProjectProposalRepository;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectProposalService {

    private final ProjectProposalRepository projectProposalRepository;
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final NotificationService notificationService;

    /**
     * 클라이언트가 본인이 등록한 프로젝트 중 하나를 선택해 프리랜서에게 제안합니다.
     */
    @Transactional
    public Long sendProposal(User user, Long projectId, Long freelancerProfileId, String message) {
        requireClientRole(user);
        ClientProfile clientProfile = clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 등록되지 않았습니다."));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다. ID: " + projectId));

        if (!project.getClientProfile().getId().equals(clientProfile.getId())) {
            throw new ProjectAccessDeniedException("본인이 등록한 프로젝트에만 제안을 보낼 수 있습니다.");
        }
        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new IllegalArgumentException("모집 중인 프로젝트에만 제안을 보낼 수 있습니다.");
        }

        FreelancerProfile freelancer = freelancerProfileRepository.findById(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. ID: " + freelancerProfileId));

        if (freelancer.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인에게는 제안을 보낼 수 없습니다.");
        }

        if (projectProposalRepository.existsByProject_IdAndFreelancerProfile_IdAndStatus(
                projectId, freelancerProfileId, ProjectProposalStatus.PENDING)) {
            throw new ResourceConflictException("해당 프로젝트에 이미 진행 중인 제안이 있습니다.");
        }

        ProjectProposal proposal = ProjectProposal.builder()
                .project(project)
                .freelancerProfile(freelancer)
                .message(message)
                .build();
        Long proposalId = projectProposalRepository.save(proposal).getId();

        notificationService.notifyUser(
                freelancer.getUser().getId(),
                NotificationType.PROJECT_PROPOSAL_SENT,
                "포지션 제안 도착",
                project.getClientProfile().getCompanyName() + "에서 '" + project.getProjectName() + "' 포지션 제안을 보냈습니다.",
                proposalId
        );

        return proposalId;
    }

    /** 클라이언트가 보낸 제안 목록 */
    public Page<ProjectProposal> getSentProposals(User user, Pageable pageable) {
        requireClientRole(user);
        ClientProfile clientProfile = clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 등록되지 않았습니다."));
        return projectProposalRepository.findByProject_ClientProfile_IdOrderByCreatedAtDesc(
                clientProfile.getId(), pageable);
    }

    /** 프리랜서가 받은 제안 목록 */
    public Page<ProjectProposal> getReceivedProposals(User user, Pageable pageable) {
        requireFreelancerRole(user);
        FreelancerProfile freelancer = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 등록되지 않았습니다."));
        return projectProposalRepository.findByFreelancerProfile_IdOrderByCreatedAtDesc(
                freelancer.getId(), pageable);
    }

    @Transactional
    public void acceptProposal(User user, Long proposalId) {
        requireFreelancerRole(user);
        ProjectProposal proposal = loadProposalOwnedByFreelancer(proposalId, user);
        proposal.accept();
        proposal.getProject().assignFreelancer(proposal.getFreelancerProfile());

        notificationService.notifyUser(
                proposal.getProject().getClientProfile().getUser().getId(),
                NotificationType.PROJECT_PROPOSAL_ACCEPTED,
                "포지션 제안 수락",
                proposal.getFreelancerProfile().getUser().getNickname() + " 님이 포지션 제안을 수락했습니다.",
                proposal.getId()
        );
    }

    @Transactional
    public void rejectProposal(User user, Long proposalId) {
        requireFreelancerRole(user);
        ProjectProposal proposal = loadProposalOwnedByFreelancer(proposalId, user);
        proposal.reject();

        notificationService.notifyUser(
                proposal.getProject().getClientProfile().getUser().getId(),
                NotificationType.PROJECT_PROPOSAL_REJECTED,
                "포지션 제안 거절",
                proposal.getFreelancerProfile().getUser().getNickname() + " 님이 포지션 제안을 거절했습니다.",
                proposal.getId()
        );
    }

    private ProjectProposal loadProposalOwnedByFreelancer(Long proposalId, User freelancerUser) {
        ProjectProposal proposal = projectProposalRepository.findDetailedById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("제안을 찾을 수 없습니다. ID: " + proposalId));
        if (!proposal.getFreelancerProfile().getUser().getId().equals(freelancerUser.getId())) {
            throw new ProjectAccessDeniedException("해당 제안을 처리할 권한이 없습니다.");
        }
        return proposal;
    }

    private static void requireClientRole(User user) {
        Role role = user.getRole();
        if (role != Role.CLIENT && role != Role.BOTH) {
            throw new ProjectAccessDeniedException("클라이언트만 프로젝트 제안을 보낼 수 있습니다.");
        }
    }

    private static void requireFreelancerRole(User user) {
        Role role = user.getRole();
        if (role != Role.FREELANCER && role != Role.BOTH) {
            throw new ProjectAccessDeniedException("프리랜서만 받은 제안 목록을 조회할 수 있습니다.");
        }
    }
}
