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
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioImage;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.portfolio.PortfolioSkill;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.review.FreelancerReview;
import com.devnear.web.domain.review.FreelancerReviewRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.service.ai.ProjectEmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
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

    private static final int FREELANCERS = 20;
    private static final int CLIENTS = 20;
    /** 프리랜서 1인당 포트폴리오 개수 */
    private static final int PORTFOLIOS_PER_FREELANCER = 3;
    /** 벌크 시드: 프리랜서 프로필에 합쳐 담을 최대 스킬 수 — {`@link` com.devnear.web.dto.freelancer.FreelancerProfileRequest} 상한과 맞춤 */
    private static final int SEED_PROFILE_SKILLS_MAX = 50;
    /**
     * 벌크 시드: 기본 스킬 카탈로그에서 무작위로 뽑을 태그 풀 크기(이름 기준, 앞에서부터 {@value}개).
     */
    private static final int SEED_SKILL_TAG_POOL_SIZE = 50;
    /** 포트폴리오 1건당 붙일 무작위 스킬 개수(범위 양끝 포함) */
    private static final int SEED_PORTFOLIO_RANDOM_SKILL_MIN = 3;
    private static final int SEED_PORTFOLIO_RANDOM_SKILL_MAX = 8;
    /** 클라이언트 1인당 모집 공고 개수 */
    private static final int PROJECTS_PER_CLIENT = 3;
    /** 벌크 시드: 클라이언트 공고(project_skills)에 붙는 요구 스킬 최대 개수 */
    private static final int SEED_PROJECT_SKILLS_MAX = 5;
    private static final int PORTFOLIOS = FREELANCERS * PORTFOLIOS_PER_FREELANCER;
    private static final int PROJECTS = CLIENTS * PROJECTS_PER_CLIENT;

    /** 시드 공고·거주지 분산용 한국 주요 도시(대략 중심 좌표) */
    private record KoreanCitySpot(String label, double latitude, double longitude) {
    }

    private static final KoreanCitySpot[] KOREAN_MAJOR_CITIES = {
            new KoreanCitySpot("서울 강남", 37.4980, 127.0286),
            new KoreanCitySpot("부산 해운대", 35.1631, 129.1636),
            new KoreanCitySpot("대구 중구", 35.8714, 128.6014),
            new KoreanCitySpot("인천 연수", 37.4100, 126.6788),
            new KoreanCitySpot("광주 서구", 35.1520, 126.8903),
            new KoreanCitySpot("대전 유성", 36.3623, 127.3845),
            new KoreanCitySpot("울산 남구", 35.5384, 129.3114),
            new KoreanCitySpot("세종 종촌", 36.4800, 127.2890),
            new KoreanCitySpot("수원 영통", 37.2636, 127.0286),
            new KoreanCitySpot("창원 성산", 35.2279, 128.6817),
            new KoreanCitySpot("고양 일산", 37.6584, 126.8320),
            new KoreanCitySpot("용인 기흥", 37.2752, 127.1156),
            new KoreanCitySpot("제주 시내", 33.4996, 126.5312),
    };

    /**
     * 프리랜서 거주 좌표: 시내 중심에서 대략 이 거리(미터) 도넛 안에 면적 균등 분포.
     * (한 점에 몰리지 않도록 최소 반경을 둠)
     */
    private static final int FREELANCER_SEED_RADIUS_MIN_M = 200;
    private static final int FREELANCER_SEED_RADIUS_MAX_M = 14_000;
    /**
     * 클라이언트 공고(근무·미팅 지역) 좌표: 해당 도시 중심 주변에 분산(미터).
     */
    private static final int PROJECT_SEED_RADIUS_MIN_M = 200;
    private static final int PROJECT_SEED_RADIUS_MAX_M = 12_000;

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
    private final FreelancerReviewRepository freelancerReviewRepository;

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

        log.info("[DemoBulkSeed] 완료 — 클라이언트 {}(공고 {}건/인), 프리랜서 {}(포트폴리오 {}건/인·등급·리뷰·이미지·완료건수 랜덤), 합계 공고 {}·포트폴리오 {}. 비밀번호: {}",
                CLIENTS, PROJECTS_PER_CLIENT, FREELANCERS, PORTFOLIOS_PER_FREELANCER, PROJECTS, PORTFOLIOS, DEMO_PASSWORD);
    }

    /** 단일 트랜잭션: 사용자·프로필·포트폴리오·공고 행 삽입만 수행하고 생성된 공고 ID 목록을 반환합니다. */
    private List<Long> insertSeedRows() {
        ensureFreelancerGrades();
        FreelancerGrade gradeGeneral = freelancerGradeRepository.findByName("일반")
                .orElseThrow(() -> new IllegalStateException("FreelancerGrade '일반' 없음"));
        FreelancerGrade gradeCert = freelancerGradeRepository.findByName("인증 프리랜서")
                .orElseThrow(() -> new IllegalStateException("FreelancerGrade '인증 프리랜서' 없음"));
        FreelancerGrade gradeTop = freelancerGradeRepository.findByName("TOP Talent")
                .orElseThrow(() -> new IllegalStateException("FreelancerGrade 'TOP Talent' 없음"));
        FreelancerGrade[] gradePool = {gradeGeneral, gradeCert, gradeTop};

        String encoded = passwordEncoder.encode(DEMO_PASSWORD);
        ThreadLocalRandom rnd = ThreadLocalRandom.current();

        List<ClientProfile> clientProfiles = new ArrayList<>();
        for (int i = 1; i <= CLIENTS; i++) {
            String suffix = String.format("%02d", i);
            User user = userRepository.save(User.builder()
                    .email("bulk-demo-client-" + suffix + "@local.test")
                    .password(encoded)
                    .name("데모 클라이언트 " + suffix)
                    .nickname("bulk_cl_" + suffix)
                    .phoneNumber("0109001" + String.format("%04d", i))
                    .profileImageUrl(picsumUrl("bulk-cl-avatar-" + suffix, 400, 400))
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
                    .logoUrl(picsumUrl("bulk-cl-logo-" + suffix, 320, 320))
                    .build();
            clientProfiles.add(clientProfileRepository.save(cp));
        }

        List<User> freelancerUsers = new ArrayList<>();
        List<FreelancerProfile> freelancerProfiles = new ArrayList<>();
        for (int i = 1; i <= FREELANCERS; i++) {
            String suffix = String.format("%02d", i);
            String avatarUrl = picsumUrl("bulk-fl-avatar-" + suffix, 400, 400);
            User user = userRepository.save(User.builder()
                    .email("bulk-demo-freelancer-" + suffix + "@local.test")
                    .password(encoded)
                    .name("데모 프리랜서 " + suffix)
                    .nickname("bulk_fl_" + suffix)
                    .phoneNumber("0108001" + String.format("%04d", i))
                    .profileImageUrl(avatarUrl)
                    .role(Role.FREELANCER)
                    .provider("bulk-seed")
                    .providerId("bulk-fl-" + suffix)
                    .build());

            FreelancerGrade grade = gradePool[rnd.nextInt(gradePool.length)];
            KoreanCitySpot home = KOREAN_MAJOR_CITIES[(i - 1) % KOREAN_MAJOR_CITIES.length];
            double[] homeOff = randomOffsetDegreesAroundCenter(
                    rnd, home.latitude(),
                    FREELANCER_SEED_RADIUS_MIN_M, FREELANCER_SEED_RADIUS_MAX_M);
            FreelancerProfile fp = FreelancerProfile.builder()
                    .user(user)
                    .profileImageUrl(avatarUrl)
                    .introduction("풀스택·" + TOPICS[i % TOPICS.length] + " 경험. 원격/대면 모두 가능합니다.")
                    .location(home.label())
                    .latitude(home.latitude() + homeOff[0])
                    .longitude(home.longitude() + homeOff[1])
                    .hourlyRate(50000 + i * 5000)
                    .workStyle(WorkStyle.HYBRID)
                    .isActive(true)
                    .grade(grade)
                    .build();
            fp.updateCompletedProjects(rnd.nextInt(0, 26));
            freelancerProfileRepository.save(fp);
            freelancerUsers.add(user);
            freelancerProfiles.add(fp);
        }

        int portfolioSeq = 0;
        for (int fi = 0; fi < freelancerUsers.size(); fi++) {
            User owner = freelancerUsers.get(fi);
            FreelancerProfile fp = freelancerProfiles.get(fi);
            List<Portfolio> portfoliosThisUser = new ArrayList<>(PORTFOLIOS_PER_FREELANCER);
            for (int k = 0; k < PORTFOLIOS_PER_FREELANCER; k++) {
                String topic = TOPICS[portfolioSeq % TOPICS.length];
                String thumb = picsumUrl("bulk-pf-thumb-" + portfolioSeq, 800, 450);
                Portfolio portfolio = Portfolio.builder()
                        .user(owner)
                        .title(topic + " 포트폴리오 #" + (portfolioSeq + 1))
                        .desc("역할: 리드 개발. 스택: Java, Spring, React. " + topic
                                + " 도메인에서 API 설계, DB 모델링, 배포 자동화까지 수행했습니다. (시드 데이터)")
                        .thumbnailUrl(thumb)
                        .build();
                attachSeedPortfolioSkills(portfolio, rnd);
                portfolio.addPortfolioImage(PortfolioImage.builder()
                        .portfolio(portfolio)
                        .imageUrl(picsumUrl("bulk-pf-img-" + portfolioSeq + "-a", 1200, 800))
                        .sortOrder(0)
                        .build());
                portfolio.addPortfolioImage(PortfolioImage.builder()
                        .portfolio(portfolio)
                        .imageUrl(picsumUrl("bulk-pf-img-" + portfolioSeq + "-b", 1200, 800))
                        .sortOrder(1)
                        .build());
                portfolioRepository.save(portfolio);
                portfoliosThisUser.add(portfolio);
                portfolioSeq++;
            }
            syncFreelancerProfileSkillsFromPortfolios(fp, portfoliosThisUser, rnd);
            freelancerProfileRepository.save(fp);
        }

        List<Long> projectIds = new ArrayList<>(PROJECTS);
        LocalDate baseDeadline = LocalDate.now().plusMonths(2);
        int projectSeq = 0;
        for (int ci = 0; ci < clientProfiles.size(); ci++) {
            ClientProfile client = clientProfiles.get(ci);
            for (int k = 0; k < PROJECTS_PER_CLIENT; k++) {
                KoreanCitySpot spot = KOREAN_MAJOR_CITIES[(ci * PROJECTS_PER_CLIENT + k) % KOREAN_MAJOR_CITIES.length];
                double[] spotOff = randomOffsetDegreesAroundCenter(
                        rnd, spot.latitude(),
                        PROJECT_SEED_RADIUS_MIN_M, PROJECT_SEED_RADIUS_MAX_M);
                String topic = TOPICS[projectSeq % TOPICS.length];
                boolean offline = (projectSeq % 2 == 0);
                Project project = Project.builder()
                        .clientProfile(client)
                        .projectName(topic + " 모집 #" + (projectSeq + 1))
                        .budget(3_000_000 + projectSeq * 100_000)
                        .deadline(baseDeadline.plusDays(projectSeq % 60))
                        .detail("모집 개요(시드): " + topic + " 관련 기능 개발. REST API, 단위 테스트, 코드 리뷰, 문서화 포함."
                                + " 우대: TypeScript, 클라우드 경험. 일정 협의 가능. 근무·미팅 지역: " + spot.label() + ".")
                        .online(true)
                        .offline(offline)
                        .location(spot.label())
                        .latitude(spot.latitude() + spotOff[0])
                        .longitude(spot.longitude() + spotOff[1])
                        .build();
                attachSeedProjectSkills(project, rnd);
                Project saved = projectRepository.save(project);
                projectIds.add(saved.getId());
                projectSeq++;
            }
        }

        seedFreelancerReviews(freelancerProfiles, clientProfiles, projectIds, rnd);

        return projectIds;
    }

    /** 프리랜서당 클라이언트 리뷰 약 3건 + 평균 평점 반영 (picsum 외부 이미지 없음) */
    private void seedFreelancerReviews(List<FreelancerProfile> freelancers,
                                       List<ClientProfile> clients,
                                       List<Long> projectIds,
                                       ThreadLocalRandom rnd) {
        if (freelancers.isEmpty() || clients.isEmpty() || projectIds.isEmpty()) {
            return;
        }
        final int reviewsPerFreelancer = 3;
        for (int fi = 0; fi < freelancers.size(); fi++) {
            FreelancerProfile fp = freelancers.get(fi);
            BigDecimal sumAvg = BigDecimal.ZERO;
            int written = 0;
            for (int j = 0; j < reviewsPerFreelancer; j++) {
                int pIdx = (fi * 11 + j * 19 + j * j) % projectIds.size();
                long projectId = projectIds.get(pIdx);
                ClientProfile reviewer = clients.get((fi + j) % clients.size());
                if (freelancerReviewRepository.existsByProjectIdAndReviewerClientAndFreelancer(
                        projectId, reviewer, fp)) {
                    pIdx = (pIdx + 1) % projectIds.size();
                    projectId = projectIds.get(pIdx);
                }
                if (freelancerReviewRepository.existsByProjectIdAndReviewerClientAndFreelancer(
                        projectId, reviewer, fp)) {
                    continue;
                }
                BigDecimal wq = rndScore(rnd);
                BigDecimal dl = rndScore(rnd);
                BigDecimal cm = rndScore(rnd);
                BigDecimal ex = rndScore(rnd);
                FreelancerReview review = FreelancerReview.builder()
                        .projectId(projectId)
                        .reviewerClient(reviewer)
                        .freelancer(fp)
                        .workQuality(wq)
                        .deadline(dl)
                        .communication(cm)
                        .expertise(ex)
                        .comment("벌크 시드 리뷰 #" + (j + 1) + ": 일정·커뮤니케이션 모두 만족스러웠습니다.")
                        .build();
                freelancerReviewRepository.save(review);
                sumAvg = sumAvg.add(review.getAverageScore());
                written++;
            }
            if (written > 0) {
                double avg = sumAvg.divide(BigDecimal.valueOf(written), 2, RoundingMode.HALF_UP).doubleValue();
                fp.updateAverageRating(avg);
                fp.updateReviewCount(written);
                freelancerProfileRepository.save(fp);
            }
        }
    }

    private static BigDecimal rndScore(ThreadLocalRandom rnd) {
        double v = 3.0 + rnd.nextDouble() * 2.0;
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP);
    }

    /**
     * 위도·경도 기준점(시내 중심 등) 주변에, 지도상 면적이 거의 균등하도록 점을 뿌립니다.
     * {@code radius = sqrt(rMin² + U·(rMax² - rMin²))}, 방위각 균등.
     *
     * @return {@code [deltaLatitudeDeg, deltaLongitudeDeg]} — 기준점에 더하면 됨
     */
    private static double[] randomOffsetDegreesAroundCenter(ThreadLocalRandom rnd,
                                                            double centerLatDeg,
                                                            int minRadiusMeters,
                                                            int maxRadiusMeters) {
        double theta = rnd.nextDouble() * 2 * Math.PI;
        double rMin = minRadiusMeters;
        double rMax = maxRadiusMeters;
        double radiusMeters = Math.sqrt(rMin * rMin + rnd.nextDouble() * (rMax * rMax - rMin * rMin));
        double northM = radiusMeters * Math.cos(theta);
        double eastM = radiusMeters * Math.sin(theta);
        double latRad = Math.toRadians(centerLatDeg);
        double metersPerDegLat = 111_320.0;
        double metersPerDegLon = 111_320.0 * Math.cos(latRad);
        double dLat = northM / metersPerDegLat;
        double dLon = eastM / metersPerDegLon;
        return new double[] { dLat, dLon };
    }

    /** picsum.photos 고정 시드 URL (CDN, 로컬 데모용) */
    private static String picsumUrl(String seed, int w, int h) {
        String s = seed.replaceAll("[^a-zA-Z0-9]", "");
        return "https://picsum.photos/seed/" + s + "/" + w + "/" + h;
    }

    /** {@link DefaultSkillCatalog} 앞쪽 {@value #SEED_SKILL_TAG_POOL_SIZE}개 이름 — 벌크 시드 무작위 태그 풀 */
    private static List<String> seedSkillTagPool() {
        String[] all = DefaultSkillCatalog.NAMES;
        int n = Math.min(SEED_SKILL_TAG_POOL_SIZE, all.length);
        return List.of(Arrays.copyOfRange(all, 0, n));
    }

    /**
     * 풀 {@link #seedSkillTagPool()}을 섞은 뒤 DB에 존재하는 스킬을 최대 {@code limit}개까지 채웁니다.
     */
    private LinkedHashMap<Long, Skill> resolveRandomSkillsFromPool(ThreadLocalRandom rnd, int limit) {
        List<String> pool = new ArrayList<>(seedSkillTagPool());
        Collections.shuffle(pool, rnd);
        LinkedHashMap<Long, Skill> out = new LinkedHashMap<>();
        for (String name : pool) {
            if (out.size() >= limit) {
                break;
            }
            skillRepository.findByName(name).ifPresent(s -> out.putIfAbsent(s.getId(), s));
        }
        return out;
    }

    /**
     * 같은 프리랜서의 포트폴리오에 붙은 스킬을 합쳐 프로필 스킬을 채웁니다(최대 {@value #SEED_PROFILE_SKILLS_MAX}개).
     * 부족하면 {@value #SEED_SKILL_TAG_POOL_SIZE}개 태그 풀에서 무작위로 보충합니다.
     */
    private void syncFreelancerProfileSkillsFromPortfolios(FreelancerProfile fp,
                                                         List<Portfolio> portfolios,
                                                         ThreadLocalRandom rnd) {
        LinkedHashMap<Long, Skill> merged = new LinkedHashMap<>();
        for (Portfolio p : portfolios) {
            for (PortfolioSkill ps : p.getPortfolioSkills()) {
                Skill s = ps.getSkill();
                merged.putIfAbsent(s.getId(), s);
            }
        }
        List<Skill> picked = merged.values().stream()
                .limit(SEED_PROFILE_SKILLS_MAX)
                .collect(Collectors.toList());
        while (picked.size() < SEED_PROFILE_SKILLS_MAX) {
            int before = picked.size();
            LinkedHashMap<Long, Skill> more = resolveRandomSkillsFromPool(rnd, SEED_PROFILE_SKILLS_MAX);
            for (Skill s : more.values()) {
                if (picked.size() >= SEED_PROFILE_SKILLS_MAX) {
                    break;
                }
                if (picked.stream().noneMatch(x -> x.getId().equals(s.getId()))) {
                    picked.add(s);
                }
            }
            if (picked.size() == before) {
                break;
            }
        }
        List<FreelancerSkill> links = picked.stream()
                .map(skill -> FreelancerSkill.builder()
                        .freelancerProfile(fp)
                        .skill(skill)
                        .build())
                .collect(Collectors.toList());
        fp.updateSkills(links);
    }

    /**
     * 포트폴리오에 {@link PortfolioSkill} 연결 — 태그 풀 {@value #SEED_SKILL_TAG_POOL_SIZE}개 중 무작위
     * {@value #SEED_PORTFOLIO_RANDOM_SKILL_MIN}~{@value #SEED_PORTFOLIO_RANDOM_SKILL_MAX}개.
     */
    private void attachSeedPortfolioSkills(Portfolio portfolio, ThreadLocalRandom rnd) {
        int count = rnd.nextInt(SEED_PORTFOLIO_RANDOM_SKILL_MIN, SEED_PORTFOLIO_RANDOM_SKILL_MAX + 1);
        LinkedHashMap<Long, Skill> resolved = resolveRandomSkillsFromPool(rnd, count);
        if (resolved.isEmpty()) {
            log.warn("[DemoBulkSeed] 포트폴리오 스킬을 DB에서 찾지 못했습니다. DataInitializer 기본 스킬 시드 후 다시 실행하세요.");
            return;
        }
        for (Skill skill : resolved.values()) {
            portfolio.addPortfolioSkill(PortfolioSkill.builder()
                    .portfolio(portfolio)
                    .skill(skill)
                    .build());
        }
    }

    /**
     * 공고별 요구 스킬 태그({@link ProjectSkill}) — 태그 풀 {@value #SEED_SKILL_TAG_POOL_SIZE}개 중 무작위
     * 최대 {@value #SEED_PROJECT_SKILLS_MAX}개.
     */
    private void attachSeedProjectSkills(Project project, ThreadLocalRandom rnd) {
        LinkedHashMap<Long, Skill> resolved = resolveRandomSkillsFromPool(rnd, SEED_PROJECT_SKILLS_MAX);
        if (resolved.isEmpty()) {
            log.warn("[DemoBulkSeed] 공고 스킬을 DB에서 찾지 못했습니다. DataInitializer 기본 스킬 시드 후 다시 실행하세요.");
            return;
        }
        List<ProjectSkill> projectSkills = resolved.values().stream()
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
     * 예전에 시드만 하고 임베딩이 비어 있던 DB:
     * GEMINI 키가 있으면 벌크 시드 공고 임베딩을 보충합니다.
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
