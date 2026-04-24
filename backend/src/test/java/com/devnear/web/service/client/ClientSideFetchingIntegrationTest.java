package com.devnear.web.service.client;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.bookmark.BookmarkFreelancer;
import com.devnear.web.domain.bookmark.BookmarkFreelancerRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.domain.proposal.Proposal;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.application.ApplicantResponse;
import com.devnear.test.config.QueryCountingTestConfiguration;
import com.devnear.test.support.QueryCountExtension;
import com.devnear.test.support.QueryCountHolder;
import com.devnear.web.service.application.ApplicationService;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 클라이언트 도메인(찜 프리랜서, 내 공고, 프로필, 지원자 목록)에서 fetch join / EntityGraph로
 * 연관이 미리 초기화되는지 검증합니다. (LazyInitializationException·N+1 회귀 방지)
 */
@SpringBootTest
@Transactional
@Import(QueryCountingTestConfiguration.class)
@ExtendWith(QueryCountExtension.class)
class ClientSideFetchingIntegrationTest {

    @Autowired
    private BookmarkFreelancerRepository bookmarkFreelancerRepository;
    @Autowired
    private ClientProfileRepository clientProfileRepository;
    @Autowired
    private FreelancerGradeRepository freelancerGradeRepository;
    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private ProjectApplicationRepository projectApplicationRepository;
    @Autowired
    private ProposalRepository proposalRepository;
    @Autowired
    private SkillRepository skillRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ApplicationService applicationService;

    /** 다건 N+1 회귀 검증용(찜·내 공고). 늘리면 SELECT 상한도 함께 검토 */
    private static final int MULTI_ROW_COUNT = 15;

    @Test
    void clientBookmarkFreelancerPage_initializesFreelancerUserAndSkills() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-fetch-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-bm-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-bm-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co " + s)
                .bn("BNC" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cl-" + s)
                .build());

        User flUser = userRepository.save(User.builder()
                .email("cl-bm-f-" + s + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("cl-bm-f-" + s)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pcf-" + s)
                .build());
        FreelancerProfile fp = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(flUser)
                .introduction("intro")
                .grade(grade)
                .build());
        fp.updateSkills(List.of(FreelancerSkill.builder().freelancerProfile(fp).skill(skill).build()));
        freelancerProfileRepository.save(fp);

        bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                .clientProfile(clientProfile)
                .freelancerProfile(fp)
                .build());
        bookmarkFreelancerRepository.flush();

        QueryCountHolder.reset();
        Page<BookmarkFreelancer> page = bookmarkFreelancerRepository.findAllByClientProfile(
                clientProfile, PageRequest.of(0, 10));
        assertThat(QueryCountHolder.selectExecutions()).as("찜 목록 조회는 N+1 없이 소수의 SELECT로 끝나야 함")
                .isPositive()
                .isLessThanOrEqualTo(5);
        assertThat(page.getContent()).hasSize(1);
        BookmarkFreelancer row = page.getContent().get(0);
        assertThat(Hibernate.isInitialized(row.getFreelancerProfile())).isTrue();
        assertThat(Hibernate.isInitialized(row.getFreelancerProfile().getUser())).isTrue();
        assertThat(Hibernate.isInitialized(row.getFreelancerProfile().getFreelancerSkills())).isTrue();
        assertThat(row.getFreelancerProfile().getFreelancerSkills()).isNotEmpty();
        assertThat(Hibernate.isInitialized(row.getFreelancerProfile().getFreelancerSkills().get(0).getSkill()))
                .isTrue();
    }

    @Test
    void clientProfile_findByUserId_initializesUser() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        User clientUser = userRepository.save(User.builder()
                .email("cl-cp-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-cp-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc2-" + s)
                .build());
        clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co2 " + s)
                .bn("BNC2" + s)
                .build());
        clientProfileRepository.flush();

        QueryCountHolder.reset();
        ClientProfile loaded = clientProfileRepository.findByUser_Id(clientUser.getId()).orElseThrow();
        assertThat(QueryCountHolder.selectExecutions()).as("클라 프로필+유저는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(3);
        assertThat(Hibernate.isInitialized(loaded.getUser())).isTrue();
        assertThat(loaded.getUser().getEmail()).contains("cl-cp-");
    }

    @Test
    void clientMyProjects_initializesClientUserAndProjectSkills() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-pr-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-pr-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-pr-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc3-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co3 " + s)
                .bn("BNC3" + s)
                .build());

        Project project = Project.builder()
                .clientProfile(clientProfile)
                .projectName("공고 " + s)
                .budget(1000)
                .deadline(LocalDate.now().plusDays(30))
                .detail("d")
                .online(true)
                .offline(false)
                .listingKind(ProjectListingKind.MARKETPLACE)
                .build();
        project.updateSkills(List.of(ProjectSkill.builder().project(project).skill(skill).build()));
        projectRepository.save(project);
        projectRepository.flush();

        QueryCountHolder.reset();
        Page<Project> page = projectRepository.findAllByClientProfile(clientProfile, PageRequest.of(0, 10));
        assertThat(QueryCountHolder.selectExecutions()).as("내 공고 목록+연관은 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);
        assertThat(page.getContent()).hasSize(1);
        Project p = page.getContent().get(0);
        assertThat(Hibernate.isInitialized(p.getClientProfile())).isTrue();
        assertThat(Hibernate.isInitialized(p.getClientProfile().getUser())).isTrue();
        assertThat(Hibernate.isInitialized(p.getProjectSkills())).isTrue();
        assertThat(p.getProjectSkills()).isNotEmpty();
        assertThat(Hibernate.isInitialized(p.getProjectSkills().get(0).getSkill())).isTrue();
    }

    @Test
    void sentProposals_initializesFreelancerUser() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-prop-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-sp-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-sp-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc4-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co4 " + s)
                .bn("BNC4" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cl-sp-" + s)
                .build());
        User flUser = userRepository.save(User.builder()
                .email("cl-sp-f-" + s + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("cl-sp-f-" + s)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pcf4-" + s)
                .build());
        FreelancerProfile fp = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(flUser)
                .introduction("intro")
                .grade(grade)
                .build());
        fp.updateSkills(List.of(FreelancerSkill.builder().freelancerProfile(fp).skill(skill).build()));
        freelancerProfileRepository.save(fp);

        Project project = projectRepository.save(Project.builder()
                .clientProfile(clientProfile)
                .projectName("공고sp " + s)
                .budget(2000)
                .deadline(LocalDate.now().plusDays(30))
                .detail("d")
                .online(true)
                .offline(false)
                .listingKind(ProjectListingKind.MARKETPLACE)
                .build());

        proposalRepository.save(Proposal.builder()
                .project(project)
                .clientProfile(clientProfile)
                .freelancerProfile(fp)
                .message("msg")
                .offeredPrice(100)
                .build());
        proposalRepository.flush();

        QueryCountHolder.reset();
        List<Proposal> list = proposalRepository.findSentProposalsByClientId(clientProfile.getId());
        assertThat(QueryCountHolder.selectExecutions()).as("보낸 제안 목록 조회는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);
        assertThat(list).hasSize(1);
        Proposal pr = list.get(0);
        assertThat(Hibernate.isInitialized(pr.getFreelancerProfile())).isTrue();
        assertThat(Hibernate.isInitialized(pr.getFreelancerProfile().getUser())).isTrue();
        assertThat(Hibernate.isInitialized(pr.getProject())).isTrue();
    }

    @Test
    void getApplicantsForMyProject_mapsWithoutLazyFailure() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-app-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-app-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-app-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc5-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co5 " + s)
                .bn("BNC5" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cl-app-" + s)
                .build());
        User flUser = userRepository.save(User.builder()
                .email("cl-app-f-" + s + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("cl-app-f-" + s)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pcf5-" + s)
                .build());
        FreelancerProfile fp = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(flUser)
                .introduction("intro")
                .grade(grade)
                .build());
        fp.updateSkills(List.of(FreelancerSkill.builder().freelancerProfile(fp).skill(skill).build()));
        freelancerProfileRepository.save(fp);

        Project project = projectRepository.save(Project.builder()
                .clientProfile(clientProfile)
                .projectName("공고app " + s)
                .budget(3000)
                .deadline(LocalDate.now().plusDays(30))
                .detail("d")
                .online(true)
                .offline(false)
                .listingKind(ProjectListingKind.MARKETPLACE)
                .build());

        projectApplicationRepository.save(ProjectApplication.builder()
                .project(project)
                .freelancerProfile(fp)
                .clientProfile(clientProfile)
                .bidPrice(50)
                .message("지원")
                .matchingRate(1.0)
                .build());

        proposalRepository.save(Proposal.builder()
                .project(project)
                .clientProfile(clientProfile)
                .freelancerProfile(fp)
                .message("제안")
                .offeredPrice(60)
                .build());
        projectApplicationRepository.flush();

        QueryCountHolder.reset();
        List<ApplicantResponse> applicants = applicationService.getApplicantsForMyProject(clientUser, project.getId());
        assertThat(QueryCountHolder.selectExecutions()).as("지원자 목록 조회는 과다 SELECT 없이")
                .isPositive()
                .isLessThanOrEqualTo(12);
        assertThat(applicants).isNotEmpty();
        assertThat(applicants.stream().map(ApplicantResponse::getFreelancerNickname).anyMatch(n -> n != null && !n.isBlank()))
                .isTrue();
    }

    @Test
    void clientBookmarkFreelancerPage_manyRows_selectCountDoesNotScaleLinearly() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-fetch-mr-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-bm-mr-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-bm-mr-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pccbmr-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoBmr " + s)
                .bn("BNBmr" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cl-bmr-" + s)
                .build());

        for (int i = 1; i <= MULTI_ROW_COUNT; i++) {
            String idx = String.format("%02d", i);
            User flUser = userRepository.save(User.builder()
                    .email("cl-bm-mr-f-" + s + "-" + idx + "@test.dev")
                    .password("pw")
                    .name("프리" + idx)
                    .nickname("cl-bm-mr-f-" + s + "-" + idx)
                    .role(Role.FREELANCER)
                    .provider("test")
                    .providerId("pcfbmr-" + s + "-" + idx)
                    .build());
            FreelancerProfile fp = freelancerProfileRepository.save(FreelancerProfile.builder()
                    .user(flUser)
                    .introduction("intro")
                    .grade(grade)
                    .build());
            fp.updateSkills(List.of(FreelancerSkill.builder().freelancerProfile(fp).skill(skill).build()));
            freelancerProfileRepository.save(fp);
            bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                    .clientProfile(clientProfile)
                    .freelancerProfile(fp)
                    .build());
        }
        bookmarkFreelancerRepository.flush();

        QueryCountHolder.reset();
        Page<BookmarkFreelancer> page = bookmarkFreelancerRepository.findAllByClientProfile(
                clientProfile, PageRequest.of(0, 50));
        assertThat(QueryCountHolder.selectExecutions())
                .as(String.format("찜 %d건이어도 N+1이면 행마다 SELECT가 불어나므로 상한으로 막음", MULTI_ROW_COUNT))
                .isPositive()
                .isLessThanOrEqualTo(12);
        assertThat(page.getContent()).hasSize(MULTI_ROW_COUNT);
        for (BookmarkFreelancer row : page.getContent()) {
            assertThat(Hibernate.isInitialized(row.getFreelancerProfile())).isTrue();
            assertThat(Hibernate.isInitialized(row.getFreelancerProfile().getUser())).isTrue();
            assertThat(Hibernate.isInitialized(row.getFreelancerProfile().getFreelancerSkills())).isTrue();
        }
    }

    @Test
    void clientMyProjects_manyRows_selectCountDoesNotScaleLinearly() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cl-pr-mr-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cl-pr-mr-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cl-pr-mr-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pccpmr-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoPmr " + s)
                .bn("BNCPmr" + s)
                .build());

        for (int i = 1; i <= MULTI_ROW_COUNT; i++) {
            Project project = Project.builder()
                    .clientProfile(clientProfile)
                    .projectName("공고MR " + s + "-" + i)
                    .budget(1000 + i)
                    .deadline(LocalDate.now().plusDays(30))
                    .detail("d")
                    .online(true)
                    .offline(false)
                    .listingKind(ProjectListingKind.MARKETPLACE)
                    .build();
            project.updateSkills(List.of(ProjectSkill.builder().project(project).skill(skill).build()));
            projectRepository.save(project);
        }
        projectRepository.flush();

        QueryCountHolder.reset();
        Page<Project> page = projectRepository.findAllByClientProfile(clientProfile, PageRequest.of(0, 50));
        assertThat(QueryCountHolder.selectExecutions())
                .as(String.format("내 공고 %d건이어도 공고·스킬 N+1이면 SELECT가 크게 불어남", MULTI_ROW_COUNT))
                .isPositive()
                .isLessThanOrEqualTo(14);
        assertThat(page.getContent()).hasSize(MULTI_ROW_COUNT);
        for (Project p : page.getContent()) {
            assertThat(Hibernate.isInitialized(p.getClientProfile())).isTrue();
            assertThat(Hibernate.isInitialized(p.getClientProfile().getUser())).isTrue();
            assertThat(Hibernate.isInitialized(p.getProjectSkills())).isTrue();
        }
    }
}
