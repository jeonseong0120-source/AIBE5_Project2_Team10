package com.devnear.global.seed;

import com.devnear.global.config.DefaultSkillCatalog;
import com.devnear.global.config.GeminiEmbeddingProperties;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.WorkStyle;
import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.portfolio.PortfolioSkill;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.service.ai.ProjectEmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 로컬/스테이징에서 UI·AI 추천 등을 테스트하기 위한 대량 데모 데이터 삽입.
 * <p>
 * 활성화: {@code app.seed.bulk-demo=true} (기본 false).
 * 멱등: 선행 프리랜서 계정 이메일이 이미 있으면 전체 스킵.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DemoBulkSeedService {

    private static final String MARKER_EMAIL = "bulk-demo-freelancer-01@local.test";
    private static final String DEMO_PASSWORD = "BulkDemo1!";

    private static final int FREELANCERS = 10;
    private static final int CLIENTS = 10;
    private static final int PORTFOLIOS = 50;
    private static final int PROJECTS = 50;

    /** {@link com.devnear.global.config.DefaultSkillCatalog}와 동일한 이름이어야 조회됨 */
    private static final String[] DEFAULT_SKILL_NAMES_FOR_SEED = DefaultSkillCatalog.NAMES;

    private static final String[] TOPICS = {
            "Spring Boot REST API",
            "React 대시보드",
            "Next.js 이커머스",
            "Flutter 모바일",
            "AWS 인프라",
            "Kubernetes 배포",
            "Python 데이터 파이프라인",
            "Figma UI 키트",
            "Node.js 마이크로서비스",
            "TypeScript 풀스택",
            "PostgreSQL 스키마 설계",
            "Redis 캐시",
            "Elasticsearch 검색",
            "CI/CD GitHub Actions",
            "OAuth2 소셜 로그인",
            "WebSocket 실시간 채팅",
            "JPA 성능 튜닝",
            "Tailwind 랜딩 페이지",
            "Three.js 3D 뷰어",
            "블록체인 지갑 연동",
            "OpenAI 연동 챗봇",
            "지도·위치 기반 서비스",
            "결제 PG 연동",
            "관리자 백오피스",
            "알림·푸시",
            "멀티테넌시 SaaS",
            "보안 감사·로그",
            "모니터링 대시보드",
            "이미지 CDN·리사이즈",
            "문서 OCR",
            "배치 스케줄러",
            "GraphQL API",
            "모바일 푸시·딥링크",
            "A/B 테스트",
            "국제화 i18n",
            "접근성 WCAG",
            "성능 프로파일링",
            "레거시 마이그레이션",
            "테스트 자동화",
            "DR 재해복구",
            "멀티리전 배포",
            "실시간 협업 편집",
            "동영상 스트리밍",
            "추천 알고리즘",
            "챗봇 FAQ",
            "재고·주문 도메인",
            "정산·청구서",
            "권한 RBAC",
            "감사 로그 불변 저장",
            "대용량 파일 업로드",
            "SEO 최적화",
            "PWA 오프라인",
            "IoT 센서 수집",
            "머신러닝 모델 서빙",
            "실시간 지표 수집",
            "멀티브랜드 화이트라벨"
    };

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final FreelancerGradeRepository freelancerGradeRepository;
    private final PortfolioRepository portfolioRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlatformTransactionManager transactionManager;
    private final ProjectEmbeddingService projectEmbeddingService;
    private final GeminiEmbeddingProperties geminiEmbeddingProperties;

    /**
     * DB 삽입은 짧은 트랜잭션으로 커밋한 뒤, 공고별 Gemini 임베딩은 트랜잭션 밖에서 호출합니다(외부 API·연결 점유 방지).
     */
    public void seedIfNeeded() {
        if (userRepository.findByEmail(MARKER_EMAIL).isPresent()) {
            maybeBackfillBulkSeedEmbeddings();
            log.info("[DemoBulkSeed] 이미 시드됨 ({} 존재). 삽입 스킵.", MARKER_EMAIL);
            return;
        }

        List<Long> projectIds = new TransactionTemplate(transactionManager).execute(status -> insertSeedRows());
        if (projectIds == null || projectIds.isEmpty()) {
            return;
        }

        log.info("[DemoBulkSeed] 공고 {}건 임베딩 갱신 시작 (GEMINI_API_KEY 설정 시 AI 추천 후보로 사용 가능)", projectIds.size());
        int embedded = 0;
        for (Long projectId : projectIds) {
            try {
                projectEmbeddingService.refreshEmbeddingForProjectId(projectId);
                embedded++;
            } catch (Exception e) {
                log.warn("[DemoBulkSeed] 공고 임베딩 실패 projectId={}", projectId, e);
            }
        }
        log.info("[DemoBulkSeed] 임베딩 시도 {}/{}건 완료", embedded, projectIds.size());

        log.info("[DemoBulkSeed] 완료 — 클라이언트 {}, 프리랜서 {}, 포트폴리오 {}, 공고 {}. 비밀번호: {}",
                CLIENTS, FREELANCERS, PORTFOLIOS, PROJECTS, DEMO_PASSWORD);
    }

    /** 단일 트랜잭션: 사용자·프로필·포트폴리오·공고 행 삽입만 수행하고 생성된 공고 ID 목록을 반환합니다. */
    private List<Long> insertSeedRows() {
        ensureFreelancerGrades();
        FreelancerGrade defaultGrade = freelancerGradeRepository.findByName("일반")
                .orElseThrow(() -> new IllegalStateException("FreelancerGrade '일반' 없음"));

        String encoded = passwordEncoder.encode(DEMO_PASSWORD);

        List<ClientProfile> clientProfiles = new ArrayList<>();
        for (int i = 1; i <= CLIENTS; i++) {
            String suffix = String.format("%02d", i);
            User user = userRepository.save(User.builder()
                    .email("bulk-demo-client-" + suffix + "@local.test")
                    .password(encoded)
                    .name("데모 클라이언트 " + suffix)
                    .nickname("bulk_cl_" + suffix)
                    .phoneNumber("0109001" + String.format("%04d", i))
                    .profileImageUrl(null)
                    .role(Role.CLIENT)
                    .provider("bulk-seed")
                    .providerId("bulk-client-" + suffix)
                    .build());

            ClientProfile cp = ClientProfile.builder()
                    .user(user)
                    .companyName("데모 주식회사 " + suffix)
                    .representativeName("대표 " + suffix)
                    .bn("SEEDBN" + String.format("%014d", 100000 + i))
                    .introduction("벌크 시드 클라이언트 " + i + " — 웹/앱 프로젝트를 자주 의뢰합니다.")
                    .homepageUrl("https://example.com/seed-client-" + suffix)
                    .phoneNum("021234" + String.format("%04d", i))
                    .logoUrl(null)
                    .build();
            clientProfiles.add(clientProfileRepository.save(cp));
        }

        List<User> freelancerUsers = new ArrayList<>();
        for (int i = 1; i <= FREELANCERS; i++) {
            String suffix = String.format("%02d", i);
            User user = userRepository.save(User.builder()
                    .email("bulk-demo-freelancer-" + suffix + "@local.test")
                    .password(encoded)
                    .name("데모 프리랜서 " + suffix)
                    .nickname("bulk_fl_" + suffix)
                    .phoneNumber("0108001" + String.format("%04d", i))
                    .profileImageUrl(null)
                    .role(Role.FREELANCER)
                    .provider("bulk-seed")
                    .providerId("bulk-fl-" + suffix)
                    .build());

            FreelancerProfile fp = FreelancerProfile.builder()
                    .user(user)
                    .profileImageUrl(null)
                    .introduction("풀스택·" + TOPICS[i % TOPICS.length] + " 경험. 원격/대면 모두 가능합니다.")
                    .location("서울")
                    .latitude(37.5 + i * 0.01)
                    .longitude(127.0 + i * 0.01)
                    .hourlyRate(50000 + i * 5000)
                    .workStyle(WorkStyle.HYBRID)
                    .isActive(true)
                    .grade(defaultGrade)
                    .build();
            freelancerProfileRepository.save(fp);
            freelancerUsers.add(user);
        }

        for (int p = 0; p < PORTFOLIOS; p++) {
            User owner = freelancerUsers.get(p % freelancerUsers.size());
            String topic = TOPICS[p % TOPICS.length];
            Portfolio portfolio = Portfolio.builder()
                    .user(owner)
                    .title(topic + " 포트폴리오 #" + (p + 1))
                    .desc("역할: 리드 개발. 스택: Java, Spring, React. " + topic
                            + " 도메인에서 API 설계, DB 모델링, 배포 자동화까지 수행했습니다. (시드 데이터)")
                    .thumbnailUrl(null)
                    .build();
            attachSeedPortfolioSkills(portfolio, topic, p);
            portfolioRepository.save(portfolio);
        }

        List<Long> projectIds = new ArrayList<>(PROJECTS);
        LocalDate baseDeadline = LocalDate.now().plusMonths(2);
        for (int j = 0; j < PROJECTS; j++) {
            ClientProfile client = clientProfiles.get(j % clientProfiles.size());
            String topic = TOPICS[j % TOPICS.length];
            Project project = Project.builder()
                    .clientProfile(client)
                    .projectName(topic + " 모집 #" + (j + 1))
                    .budget(3_000_000 + j * 100_000)
                    .deadline(baseDeadline.plusDays(j % 60))
                    .detail("모집 개요(시드): " + topic + " 관련 기능 개발. REST API, 단위 테스트, 코드 리뷰, 문서화 포함."
                            + " 우대: TypeScript, 클라우드 경험. 일정 협의 가능.")
                    .online(true)
                    .offline(j % 3 == 0)
                    .location(j % 3 == 0 ? "서울 강남" : null)
                    .latitude(j % 3 == 0 ? 37.498 : null)
                    .longitude(j % 3 == 0 ? 127.028 : null)
                    .build();
            attachSeedProjectSkills(project, topic, j);
            Project saved = projectRepository.save(project);
            projectIds.add(saved.getId());
        }

        return projectIds;
    }

    /**
     * 토픽 문자열로 시드용 스킬 이름 집합을 만듭니다. 공고·포트폴리오 시드에서 공통 사용.
     */
    private LinkedHashSet<String> buildSeedSkillNamesFromTopic(String topic, int index) {
        LinkedHashSet<String> names = new LinkedHashSet<>();
        String t = topic.toLowerCase();
        if (t.contains("spring") || t.contains("java") || t.contains("jpa")) {
            names.add("Java");
            names.add("Spring Boot");
        }
        if (t.contains("react") || t.contains("next")) {
            names.add("React");
            if (t.contains("next")) {
                names.add("Next.js");
            }
        }
        if (t.contains("typescript") || t.contains("풀스택")) {
            names.add("TypeScript");
        }
        if (t.contains("node")) {
            names.add("Node.js");
        }
        if (t.contains("python")) {
            names.add("Python");
        }
        if (t.contains("aws") || t.contains("kubernetes") || t.contains("docker")
                || t.contains("인프라") || t.contains("배포") || t.contains("devops")) {
            names.add("AWS");
            names.add("Docker");
        }
        if (t.contains("figma") || t.contains("ui") || t.contains("디자인")) {
            names.add("Figma");
        }
        int fill = 0;
        while (names.size() < 3 && fill < DEFAULT_SKILL_NAMES_FOR_SEED.length * 2) {
            names.add(DEFAULT_SKILL_NAMES_FOR_SEED[(index + fill) % DEFAULT_SKILL_NAMES_FOR_SEED.length]);
            fill++;
        }
        return names;
    }

    /**
     * 포트폴리오에 {@link PortfolioSkill} 연결 (마이페이지·프로필 API의 skills 배열과 동일).
     */
    private void attachSeedPortfolioSkills(Portfolio portfolio, String topic, int index) {
        LinkedHashSet<String> names = buildSeedSkillNamesFromTopic(topic, index);
        List<Skill> skills = skillRepository.findByNameIn(new ArrayList<>(names));
        if (skills.isEmpty()) {
            log.warn("[DemoBulkSeed] 포트폴리오 스킬을 DB에서 찾지 못했습니다. 요청 이름: {}", names);
            return;
        }
        for (Skill skill : skills) {
            portfolio.addPortfolioSkill(PortfolioSkill.builder()
                    .portfolio(portfolio)
                    .skill(skill)
                    .build());
        }
    }

    /**
     * 공고별 요구 스킬 태그({@link ProjectSkill}). 토픽 키워드 우선, 부족하면 기본 풀에서 채움.
     */
    private void attachSeedProjectSkills(Project project, String topic, int index) {
        LinkedHashSet<String> names = buildSeedSkillNamesFromTopic(topic, index);

        List<Skill> skills = skillRepository.findByNameIn(new ArrayList<>(names));
        if (skills.isEmpty()) {
            log.warn("[DemoBulkSeed] 스킬을 DB에서 찾지 못했습니다. DataInitializer 기본 스킬 시드 후 다시 실행하세요. 요청 이름: {}", names);
            return;
        }
        List<ProjectSkill> projectSkills = skills.stream()
                .map(skill -> ProjectSkill.builder()
                        .project(project)
                        .skill(skill)
                        .build())
                .collect(Collectors.toList());
        project.updateSkills(projectSkills);
    }

    private void ensureFreelancerGrades() {
        List<String> names = List.of("일반", "인증 프리랜서", "TOP Talent");
        for (String name : names) {
            if (freelancerGradeRepository.findByName(name).isEmpty()) {
                freelancerGradeRepository.save(FreelancerGrade.builder().name(name).build());
                log.info("[DemoBulkSeed] FreelancerGrade 추가: {}", name);
            }
        }
    }

    /**
     * 예전에 시드만 하고 임베딩이 비어 있던 DB: GEMINI 키가 있으면 벌크 시드 공고에 임베딩만 채웁니다.
     */
    private void maybeBackfillBulkSeedEmbeddings() {
        if (geminiEmbeddingProperties.getApiKey() == null || geminiEmbeddingProperties.getApiKey().isBlank()) {
            return;
        }
        List<Long> missing = projectRepository.findOpenBulkDemoProjectIdsMissingEmbedding(
                ProjectStatus.OPEN, ProjectListingKind.MARKETPLACE);
        if (missing.isEmpty()) {
            return;
        }
        log.info("[DemoBulkSeed] 기존 벌크 시드 공고 중 임베딩 없음 {}건 보충 시도", missing.size());
        int ok = 0;
        for (Long projectId : missing) {
            try {
                projectEmbeddingService.refreshEmbeddingForProjectId(projectId);
                ok++;
            } catch (Exception e) {
                log.warn("[DemoBulkSeed] 임베딩 보충 실패 projectId={}", projectId, e);
            }
        }
        log.info("[DemoBulkSeed] 임베딩 보충 시도 {}/{}건 완료", ok, missing.size());
    }
}
