package com.devnear.web.service.project;

import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ClientGrade;
import com.devnear.web.domain.enums.ProjectProposalStatus;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.VerificationStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectProposal;
import com.devnear.web.domain.project.ProjectProposalRepository;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.exception.ProjectAccessDeniedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ProjectProposalServiceIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClientProfileRepository clientProfileRepository;
    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private ProjectProposalRepository projectProposalRepository;
    @Autowired
    private ProjectProposalService projectProposalService;
    @Autowired
    private ChatRoomRepository chatRoomRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    private User clientUser;
    private User freelancerUser;
    private Project project;
    private Long proposalId;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        clientUser = userRepository.save(User.builder()
                .email("client-" + suffix + "@test.dev")
                .password("pw")
                .name("클라이언트")
                .nickname("nick-c-" + suffix)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("c-" + suffix)
                .build());

        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("테스트 회사")
                .representativeName("대표")
                .bn("BN" + suffix.substring(0, 6))
                .introduction("소개")
                .homepageUrl(null)
                .phoneNum("01000000000")
                .build());

        freelancerUser = userRepository.save(User.builder()
                .email("fl-" + suffix + "@test.dev")
                .password("pw")
                .name("프리랜서")
                .nickname("nick-f-" + suffix)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("f-" + suffix)
                .build());

        FreelancerProfile freelancerProfile = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(freelancerUser)
                .introduction("프리랜서 소개")
                .location("서울")
                .hourlyRate(50000)
                .build());

        project = projectRepository.save(Project.builder()
                .clientProfile(clientProfile)
                .projectName("제안 테스트 프로젝트")
                .budget(1_000_000)
                .deadline(LocalDate.now().plusWeeks(2))
                .detail("상세")
                .online(true)
                .offline(false)
                .build());

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.OPEN);

        ProjectProposal proposal = projectProposalRepository.save(ProjectProposal.builder()
                .project(project)
                .freelancerProfile(freelancerProfile)
                .message("제안 메시지")
                .build());

        proposalId = proposal.getId();
    }

    @Test
    void inquire_returnsStableChatRoomId() {
        Long roomId1 = projectProposalService.inquireChatRoom(freelancerUser, proposalId);
        Long roomId2 = projectProposalService.inquireChatRoom(freelancerUser, proposalId);

        assertThat(roomId1).isNotNull().isPositive();
        assertThat(roomId2).isEqualTo(roomId1);

        ChatRoom room = chatRoomRepository.findById(roomId1).orElseThrow();
        assertThat(room.getProject().getId()).isEqualTo(project.getId());
    }

    @Test
    void accept_persistsStatusAndSystemMessage() {
        projectProposalService.acceptProposal(freelancerUser, proposalId);

        ProjectProposal updated = projectProposalRepository.findById(proposalId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ProjectProposalStatus.ACCEPTED);

        ChatRoom room = findRoomBetweenClientAndFreelancer();
        PageRequest pageable = PageRequest.of(0, 20);
        var messages = chatMessageRepository.findByChatRoomOrderByCreatedAtAsc(room, pageable).getContent();
        assertThat(messages).hasSize(1);
        ChatMessage m = messages.get(0);
        assertThat(m.getContent()).isEqualTo("제안이 수락되었습니다.");
        assertThat(m.isSystemMessage()).isTrue();
        assertThat(m.getSender().getId()).isEqualTo(freelancerUser.getId());
    }

    @Test
    void reject_persistsStatusAndSystemMessage() {
        projectProposalService.rejectProposal(freelancerUser, proposalId);

        ProjectProposal updated = projectProposalRepository.findById(proposalId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ProjectProposalStatus.REJECTED);

        ChatRoom room = findRoomBetweenClientAndFreelancer();
        var messages = chatMessageRepository.findByChatRoomOrderByCreatedAtAsc(room, PageRequest.of(0, 20)).getContent();
        assertThat(messages).extracting(ChatMessage::getContent).containsExactly("제안이 거절되었습니다.");
        assertThat(messages.get(0).isSystemMessage()).isTrue();
    }

    @Test
    void accept_twice_throws() {
        projectProposalService.acceptProposal(freelancerUser, proposalId);
        assertThatThrownBy(() -> projectProposalService.acceptProposal(freelancerUser, proposalId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("대기 중인 제안만");
    }

    @Test
    void client_cannot_accept() {
        assertThatThrownBy(() -> projectProposalService.acceptProposal(clientUser, proposalId))
                .isInstanceOf(ProjectAccessDeniedException.class);
    }

    @Test
    void other_freelancer_cannot_accept() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User other = userRepository.save(User.builder()
                .email("other-" + suffix + "@test.dev")
                .password("pw")
                .name("다른 프리랜서")
                .nickname("nick-o-" + suffix)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("o-" + suffix)
                .build());
        freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(other)
                .introduction("x")
                .location("부산")
                .hourlyRate(40000)
                .build());

        assertThatThrownBy(() -> projectProposalService.acceptProposal(other, proposalId))
                .isInstanceOf(ProjectAccessDeniedException.class);
    }

    private ChatRoom findRoomBetweenClientAndFreelancer() {
        User first = clientUser.getId() < freelancerUser.getId() ? clientUser : freelancerUser;
        User second = clientUser.getId() < freelancerUser.getId() ? freelancerUser : clientUser;
        Project reloadedProject = projectRepository.findById(project.getId()).orElseThrow();
        return chatRoomRepository.findByProjectAndUser1AndUser2(reloadedProject, first, second)
                .orElseThrow();
    }
}
