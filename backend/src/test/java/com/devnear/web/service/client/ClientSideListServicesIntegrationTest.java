package com.devnear.web.service.client;

import com.devnear.test.config.QueryCountingTestConfiguration;
import com.devnear.test.support.QueryCountExtension;
import com.devnear.test.support.QueryCountHolder;
import com.devnear.web.domain.bookmark.BookmarkFreelancer;
import com.devnear.web.domain.bookmark.BookmarkFreelancerRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectListingKind;
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
import com.devnear.web.dto.client.ClientProfileResponse;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.dto.project.ProjectResponse;
import com.devnear.web.dto.proposal.SentProposalResponse;
import com.devnear.web.service.bookmark.BookmarkService;
import com.devnear.web.service.project.ProjectService;
import com.devnear.web.service.proposal.ProposalService;
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
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 클라이언트 마이페이지·찜 API와 동일한 서비스 경로에서 목록 조회 시
 * {@code GET /api/bookmarks/freelancers}, {@code 내 공고}, {@code 보낸 제안}, {@code /api/client/profile} 에 대응합니다.
 */
@SpringBootTest
@Transactional
@Import(QueryCountingTestConfiguration.class)
@ExtendWith(QueryCountExtension.class)
class ClientSideListServicesIntegrationTest {

    @Autowired
    private BookmarkService bookmarkService;
    @Autowired
    private ProjectService projectService;
    @Autowired
    private ProposalService proposalService;
    @Autowired
    private ClientService clientService;
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
    private ProposalRepository proposalRepository;
    @Autowired
    private SkillRepository skillRepository;
    @Autowired
    private UserRepository userRepository;

    /** 찜 프리랜서 N+1 회귀 검증: 단건이면 배치·지연 로딩 차이를 못 잡음 */
    private static final int BOOKMARK_FREELANCER_MULTI = 3;

    @Test
    void bookmarkService_getBookmarkedFreelancers_boundedSelects() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cli-bm-svc-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cli-bm-svc-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cli-bm-svc-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pbmsc-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoBmSvc " + s)
                .bn("BNBmSvc" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cli-bm-svc-" + s)
                .build());

        IntStream.range(0, BOOKMARK_FREELANCER_MULTI).forEach(i -> {
            User flUser = userRepository.save(User.builder()
                    .email("cli-bm-svc-f-" + s + "-" + i + "@test.dev")
                    .password("pw")
                    .name("프리")
                    .nickname("cli-bm-svc-f-" + s + "-" + i)
                    .role(Role.FREELANCER)
                    .provider("test")
                    .providerId("pbmsf-" + s + "-" + i)
                    .build());
            FreelancerProfile fp = freelancerProfileRepository.save(FreelancerProfile.builder()
                    .user(flUser)
                    .introduction("intro-" + i)
                    .grade(grade)
                    .build());
            fp.updateSkills(List.of(FreelancerSkill.builder().freelancerProfile(fp).skill(skill).build()));
            freelancerProfileRepository.save(fp);
            bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                    .clientProfile(clientProfile)
                    .freelancerProfile(fp)
                    .build());
        });
        bookmarkFreelancerRepository.flush();

        QueryCountHolder.reset();
        Page<FreelancerProfileResponse> page = bookmarkService.getBookmarkedFreelancers(clientUser, PageRequest.of(0, 10));
        assertThat(QueryCountHolder.selectExecutions())
                .as("BookmarkService 찜 목록: 클라 프로필+찜 페이지(EntityGraph)+등급·스킬 배치(다건에서도 SELECT 폭주 없음)")
                .isPositive()
                .isLessThanOrEqualTo(8);
        assertThat(page.getContent()).hasSize(BOOKMARK_FREELANCER_MULTI);
        assertThat(page.getContent())
                .allMatch(row -> row.getUserName() != null && !row.getUserName().isBlank());
        assertThat(page.getContent())
                .allMatch(row -> row.getSkills() != null && !row.getSkills().isEmpty());
    }

    @Test
    void projectService_getMyProjectList_boundedSelects() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cli-pr-svc-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cli-pr-svc-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cli-pr-svc-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pprsvc-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoPrSvc " + s)
                .bn("BNPrSvc" + s)
                .build());

        Project project = Project.builder()
                .clientProfile(clientProfile)
                .projectName("공고PrSvc " + s)
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
        Page<ProjectResponse> page = projectService.getMyProjectList(clientUser, null, PageRequest.of(0, 10));
        assertThat(QueryCountHolder.selectExecutions())
                .as("ProjectService 내 공고: 클라 조회+공고 페이지+지원 건수 집계")
                .isPositive()
                .isLessThanOrEqualTo(10);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getProjectName()).contains("공고PrSvc");
    }

    @Test
    void proposalService_getSentProposals_boundedSelects() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cli-sp-svc-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cli-sp-svc-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cli-sp-svc-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pspsvc-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoSpSvc " + s)
                .bn("BNSpSvc" + s)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-cli-sp-svc-" + s)
                .build());
        User flUser = userRepository.save(User.builder()
                .email("cli-sp-svc-f-" + s + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("cli-sp-svc-f-" + s)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pspsf-" + s)
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
                .projectName("공고SpSvc " + s)
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
        List<SentProposalResponse> list = proposalService.getSentProposals(clientUser);
        assertThat(QueryCountHolder.selectExecutions())
                .as("ProposalService 보낸 제안: 클라 프로필+목록 fetch")
                .isPositive()
                .isLessThanOrEqualTo(8);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).getProjectName()).contains("공고SpSvc");
        assertThat(list.get(0).getFreelancerName()).isNotBlank();
    }

    @Test
    void clientService_getMyProfile_boundedSelects() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        User clientUser = userRepository.save(User.builder()
                .email("cli-cp-svc-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cli-cp-svc-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcpsvc-" + s)
                .build());
        clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoCpSvc " + s)
                .bn("BNCpSvc" + s)
                .build());
        clientProfileRepository.flush();

        QueryCountHolder.reset();
        ClientProfileResponse res = clientService.getMyProfile(clientUser);
        assertThat(QueryCountHolder.selectExecutions())
                .as("ClientService 내 프로필 조회")
                .isPositive()
                .isLessThanOrEqualTo(6);
        assertThat(res.getCompanyName()).contains("CoCpSvc");
        assertThat(res.getEmail()).contains("cli-cp-svc-");
    }

    @Test
    void projectService_searchProjects_openMarket_boundedSelects() {
        String s = UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(Skill.builder()
                .name("cli-search-skill-" + s)
                .isDefault(false)
                .category("cat")
                .build());

        User clientUser = userRepository.save(User.builder()
                .email("cli-search-c-" + s + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("cli-search-c-" + s)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("psearchc-" + s)
                .build());
        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("CoSearch " + s)
                .bn("BNSearch" + s)
                .build());

        Project project = Project.builder()
                .clientProfile(clientProfile)
                .projectName("마켓노출 " + s)
                .budget(500)
                .deadline(LocalDate.now().plusDays(20))
                .detail("detail")
                .online(true)
                .offline(false)
                .listingKind(ProjectListingKind.MARKETPLACE)
                .build();
        project.updateSkills(List.of(ProjectSkill.builder().project(project).skill(skill).build()));
        projectRepository.save(project);
        projectRepository.flush();

        QueryCountHolder.reset();
        Page<ProjectResponse> page = projectService.searchProjects(
                null,
                null,
                null,
                null,
                null,
                null,
                PageRequest.of(0, 15));
        assertThat(QueryCountHolder.selectExecutions())
                .as("ProjectService 공개 공고 검색(마켓 목록)+지원 건수 집계")
                .isPositive()
                .isLessThanOrEqualTo(2);
        assertThat(page.getContent().stream().anyMatch(p -> p.getProjectName() != null && p.getProjectName().contains("마켓노출")))
                .isTrue();
    }
}
