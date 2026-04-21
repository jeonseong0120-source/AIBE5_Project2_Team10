package com.devnear.web.service.project;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.bookmark.BookmarkProject;
import com.devnear.web.domain.bookmark.BookmarkProjectRepository;
import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.PaymentStatus;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.payment.Payment;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.Proposal;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.review.ClientReview;
import com.devnear.web.domain.review.ClientReviewRepository;
import com.devnear.web.domain.review.FreelancerReview;
import com.devnear.web.domain.review.FreelancerReviewRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
/**
+ * 공고 삭제 시 종속 행 제거 검증.
 * {@link ProjectService#deleteProjectDependents} 주석 참조: 새 종속 테이블 추가 시 이 테스트도 확장해야 합니다.
 */

class ProjectServiceDeleteProjectIntegrationTest {

    @Autowired
    private ProjectService projectService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClientProfileRepository clientProfileRepository;
    @Autowired
    private FreelancerGradeRepository freelancerGradeRepository;
    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private ChatRoomRepository chatRoomRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    @Autowired
    private ProposalRepository proposalRepository;
    @Autowired
    private ProjectApplicationRepository projectApplicationRepository;
    @Autowired
    private BookmarkProjectRepository bookmarkProjectRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private ClientReviewRepository clientReviewRepository;
    @Autowired
    private FreelancerReviewRepository freelancerReviewRepository;
    @Autowired
    private EntityManager em;

    @Test
    void deleteProject_removesAllManualCascadeDependents() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User clientUser = userRepository.save(User.builder()
                .email("delproj-client-" + suffix + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("c-" + suffix)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pc-" + suffix)
                .build());

        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co " + suffix)
                .bn("BN" + suffix)
                .build());

        User freelancerUser = userRepository.save(User.builder()
                .email("delproj-fl-" + suffix + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("f-" + suffix)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pf-" + suffix)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-" + suffix)
                .build());

        FreelancerProfile freelancerProfile = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(freelancerUser)
                .introduction("intro")
                .grade(grade)
                .build());

        Project project = projectRepository.save(Project.builder()
                .clientProfile(clientProfile)
                .projectName("공고 " + suffix)
                .budget(500_000)
                .deadline(LocalDate.now().plusMonths(1))
                .detail("상세")
                .online(true)
                .offline(false)
                .listingKind(ProjectListingKind.MARKETPLACE)
                .build());

        Long projectId = project.getId();

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .user1(clientUser)
                .user2(freelancerUser)
                .project(project)
                .build());
        chatMessageRepository.save(ChatMessage.builder()
                .chatRoom(room)
                .sender(clientUser)
                .content("안녕")
                .systemMessage(false)
                .build());

        proposalRepository.save(Proposal.builder()
                .project(project)
                .clientProfile(clientProfile)
                .freelancerProfile(freelancerProfile)
                .message("제안")
                .offeredPrice(400_000)
                .build());

        projectApplicationRepository.save(ProjectApplication.builder()
                .project(project)
                .freelancerProfile(freelancerProfile)
                .clientProfile(clientProfile)
                .bidPrice(450_000)
                .message("지원")
                .matchingRate(0.5)
                .build());

        bookmarkProjectRepository.save(BookmarkProject.builder()
                .freelancerProfile(freelancerProfile)
                .project(project)
                .build());

        paymentRepository.save(Payment.builder()
                .orderId("ord-" + suffix)
                .amount(1000L)
                .fee(50L)
                .netAmount(950L)
                .status(PaymentStatus.READY)
                .project(project)
                .build());

        BigDecimal s = new BigDecimal("4.0");
        clientReviewRepository.save(ClientReview.builder()
                .projectId(projectId)
                .reviewerFreelancer(freelancerProfile)
                .client(clientProfile)
                .requirementClarity(s)
                .communication(s)
                .paymentReliability(s)
                .workAttitude(s)
                .comment("ok")
                .build());

        freelancerReviewRepository.save(FreelancerReview.builder()
                .projectId(projectId)
                .reviewerClient(clientProfile)
                .freelancer(freelancerProfile)
                .workQuality(s)
                .deadline(s)
                .communication(s)
                .expertise(s)
                .comment("ok")
                .build());

        em.flush();
        assertThat(countDependents(projectId)).isGreaterThan(0);

        projectService.deleteProject(clientUser, projectId);
        em.flush();
        em.clear();

        assertThat(projectRepository.findById(projectId)).isEmpty();
        assertThat(countDependents(projectId)).isZero();
    }

    private long countDependents(Long projectId) {
        long chatMessages = em.createQuery(
                        "select count(m) from ChatMessage m join m.chatRoom cr where cr.project.id = :pid",
                        Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long chatRooms = em.createQuery(
                        "select count(cr) from ChatRoom cr where cr.project.id = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long proposals = em.createQuery(
                        "select count(p) from Proposal p where p.project.id = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long applications = em.createQuery(
                        "select count(a) from ProjectApplication a where a.project.id = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long bookmarks = em.createQuery(
                        "select count(b) from BookmarkProject b where b.project.id = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long payments = em.createQuery(
                        "select count(p) from Payment p where p.project.id = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long clientReviews = em.createQuery(
                        "select count(r) from ClientReview r where r.projectId = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        long freelancerReviews = em.createQuery(
                        "select count(r) from FreelancerReview r where r.projectId = :pid", Long.class)
                .setParameter("pid", projectId)
                .getSingleResult();
        return chatMessages + chatRooms + proposals + applications + bookmarks + payments
                + clientReviews + freelancerReviews;
    }
}
