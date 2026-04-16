package com.devnear.web.service.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectProposalStatus;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.project.ProjectProposal;
import com.devnear.web.domain.project.ProjectProposalRepository;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.chat.ChatRoomResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectProposalService {

    private static final String SYSTEM_MSG_ACCEPTED = "제안이 수락되었습니다.";
    private static final String SYSTEM_MSG_REJECTED = "제안이 거절되었습니다.";

    private final ProjectProposalRepository projectProposalRepository;
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ChatService chatService;

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
        return projectProposalRepository.save(proposal).getId();
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

    /**
     * 프리랜서가 제안을 수락하고, 해당 프로젝트 기준 클라이언트–프리랜서 채팅방에 시스템 메시지를 남깁니다.
     */
    @Transactional
    public void acceptProposal(User user, Long proposalId) {
        requireFreelancerRole(user);
        ProjectProposal proposal = loadProposalOwnedByFreelancer(proposalId, user);
        proposal.accept();
        sendDecisionSystemMessage(proposal, SYSTEM_MSG_ACCEPTED);
    }

    /**
     * 프리랜서가 제안을 거절하고, 해당 채팅방에 시스템 메시지를 남깁니다.
     */
    @Transactional
    public void rejectProposal(User user, Long proposalId) {
        requireFreelancerRole(user);
        ProjectProposal proposal = loadProposalOwnedByFreelancer(proposalId, user);
        proposal.reject();
        sendDecisionSystemMessage(proposal, SYSTEM_MSG_REJECTED);
    }

    /**
     * 프리랜서가 클라이언트와 문의(채팅)하기 위해, 동일 프로젝트·동일 상대 조합의 채팅방 ID를 반환합니다.
     * 취소된 제안에는 사용할 수 없습니다.
     */
    @Transactional
    public Long inquireChatRoom(User user, Long proposalId) {
        requireFreelancerRole(user);
        ProjectProposal proposal = loadProposalOwnedByFreelancer(proposalId, user);
        if (proposal.getStatus() == ProjectProposalStatus.CANCELLED) {
            throw new IllegalStateException("취소된 제안에는 문의할 수 없습니다.");
        }

        User clientUser = proposal.getProject().getClientProfile().getUser();
        User freelancerUser = proposal.getFreelancerProfile().getUser();

        ChatRoomResponse room = chatService.getOrCreateRoomForProjectClientAndFreelancer(
                user,
                proposal.getProject(),
                clientUser,
                freelancerUser
        );
        return room.getRoomId();
    }

    private void sendDecisionSystemMessage(ProjectProposal proposal, String content) {
        User clientUser = proposal.getProject().getClientProfile().getUser();
        User freelancerUser = proposal.getFreelancerProfile().getUser();
        ChatRoom room = chatService.resolveOrCreateChatRoomForClientAndFreelancer(
                proposal.getProject(),
                clientUser,
                freelancerUser
        );
        chatService.saveSystemMessageAndBroadcast(room, freelancerUser, content);
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
