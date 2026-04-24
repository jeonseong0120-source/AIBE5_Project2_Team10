package com.devnear.web.service.project;

import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.bookmark.BookmarkProjectRepository;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSearchCond;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.review.ClientReviewRepository;
import com.devnear.web.domain.review.FreelancerReviewRepository;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.project.ProjectRequest;
import com.devnear.web.dto.project.ProjectResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.service.ai.ProjectEmbeddingService;
import com.devnear.web.service.freelancer.FreelancerGradeService;
import jakarta.persistence.EntityManager; // 🔍 추가
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final SkillRepository skillRepository;
    private final FreelancerGradeService freelancerGradeService;
    private final EntityManager em; // 🔍 직접 플러시를 위해 주입
    private final ProjectEmbeddingService projectEmbeddingService;
    private final ProposalRepository proposalRepository;
    private final ProjectApplicationRepository projectApplicationRepository;
    private final BookmarkProjectRepository bookmarkProjectRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final PaymentRepository paymentRepository;
    private final ClientReviewRepository clientReviewRepository;
    private final FreelancerReviewRepository freelancerReviewRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Long createProject(User user, ProjectRequest request) {
        return createProjectInternal(user, request, ProjectListingKind.MARKETPLACE);
    }

    /**
     * 역제안(FORM) 전용 단독 공고 — 마켓 탐색·AI 추천 후보에서 제외됩니다.
     */
    @Transactional
    public Long createProjectForProposalStandalone(User user, ProjectRequest request) {
        return createProjectInternal(user, request, ProjectListingKind.PROPOSAL_STANDALONE);
    }

    private Long createProjectInternal(User user, ProjectRequest request, ProjectListingKind listingKind) {
        ClientProfile clientProfile = findClientProfileByUser(user);

        if (request.isOffline() && (request.getLocation() == null || request.getLatitude() == null)) {
            throw new IllegalArgumentException("오프라인 프로젝트는 장소 정보가 필수입니다.");
        }

        Project project = projectRepository.save(request.toEntity(clientProfile, listingKind));

        List<Skill> skills = resolveSkills(request);
        if (!skills.isEmpty()) {
            mapSkillsToProject(project, skills);
        }

        maybeRefreshProjectEmbedding(project.getId(), listingKind);

        return project.getId();
    }

    /** 제안서 단독 공고는 마켓 비대상이므로 Gemini 임베딩을 만들지 않습니다. */
    private void maybeRefreshProjectEmbedding(Long projectId, ProjectListingKind listingKind) {
        if (listingKind == ProjectListingKind.PROPOSAL_STANDALONE) {
            return;
        }
        try {
            projectEmbeddingService.refreshEmbeddingForProjectId(projectId);
        } catch (Exception e) {
            log.warn("프로젝트 임베딩 갱신 실패(공고는 정상 저장됨): projectId={}", projectId, e);
        }
    }

    @Transactional
    public void updateProject(User user, Long projectId, ProjectRequest request) {
        Project project = findProjectAndValidateOwner(user, projectId);

        if (log.isDebugEnabled()) {
            log.debug("프로젝트 수정 시도 - ID: {}, 사용자: {}", projectId, user.getEmail());
        }

        // 1. 기본 정보 업데이트
        project.update(request);

        // 2. 기술 스택 업데이트 로직 개선
        if (request.hasSkillPayload()) {
            List<Skill> skills = resolveSkills(request);

            // 🔍 [지리는 해결책]
            // JPA는 변경 사항을 모았다가 나중에 한 번에 쏘는데, 보통 INSERT를 DELETE보다 먼저 실행함.
            // 그래서 Duplicate Entry 에러가 발생함.
            // 이를 해결하기 위해 기존 리스트를 비우고 강제로 flush()를 호출해 DELETE를 즉시 실행함.
            project.getProjectSkills().clear();
            em.flush(); // 🔥 여기서 즉시 DELETE SQL 실행!

            if (!skills.isEmpty()) {
                mapSkillsToProject(project, skills);
            }
        }

        maybeRefreshProjectEmbedding(projectId, project.getListingKind() != null
                ? project.getListingKind()
                : ProjectListingKind.MARKETPLACE);
    }

    private void mapSkillsToProject(Project project, List<Skill> skills) {
        List<ProjectSkill> projectSkills = skills.stream()
                .map(skill -> ProjectSkill.builder()
                        .project(project)
                        .skill(skill)
                        .build())
                .collect(Collectors.toList());

        // 이미 updateProject에서 clear()와 flush()를 했으므로 바로 addAll() 느낌으로 작동
        project.updateSkills(projectSkills);
    }

    // --- 이하 기존 로직 보존 ---

    private List<Skill> resolveSkills(ProjectRequest request) {
        Set<Skill> resolvedSkills = new LinkedHashSet<>();

        if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
            List<Long> requestedSkillIds = request.getSkillIds().stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            List<Skill> skillsByIds = skillRepository.findAllById(requestedSkillIds);
            if (skillsByIds.size() != requestedSkillIds.size()) {
                Set<Long> foundIds = skillsByIds.stream()
                        .map(Skill::getId)
                        .collect(Collectors.toSet());
                List<Long> missingIds = requestedSkillIds.stream()
                        .filter(id -> !foundIds.contains(id))
                        .collect(Collectors.toList());
                throw new IllegalArgumentException("존재하지 않는 스킬 ID가 포함되어 있습니다: " + missingIds);
            }
            resolvedSkills.addAll(skillsByIds);
        }

        if (request.getSkillNames() != null && !request.getSkillNames().isEmpty()) {
            List<String> requestedSkillNames = request.getSkillNames().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(name -> !name.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());

            List<Skill> existingSkills = skillRepository.findByNameIn(requestedSkillNames);
            Map<String, Skill> existingSkillMap = new HashMap<>();
            for (Skill skill : existingSkills) {
                existingSkillMap.put(skill.getName(), skill);
            }

            List<Skill> resolvedByNames = requestedSkillNames.stream()
                    .map(name -> existingSkillMap.computeIfAbsent(name, this::getOrCreateSkillByName))
                    .collect(Collectors.toList());
            resolvedSkills.addAll(resolvedByNames);
        }

        return List.copyOf(resolvedSkills);
    }

    private Skill getOrCreateSkillByName(String name) {
        skillRepository.upsertByName(name);
        return skillRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("업서트 후 스킬 조회에 실패했습니다: " + name));
    }

    @Transactional
    public void deleteProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        Long id = project.getId();
        deleteProjectDependents(id);
        projectRepository.delete(project);
    }

    /**
     * {@code projects.project_id}를 FK로 참조하는 종속 행을 먼저 삭제합니다. DB에 {@code ON DELETE CASCADE}가
     * 없거나 JPA에서 프로젝트에 매핑되지 않은 자식인 경우, 공고 삭제 전에 여기서 명시적으로 제거해야 합니다.
     * <p>
     * TODO: 새 테이블/엔티티가 {@code project_id}(또는 동일 의미의 컬럼)로 프로젝트를 참조하면
     * 이 메서드에 해당 repository의 삭제 호출을 추가하고
     * {@code com.devnear.web.service.project.ProjectServiceDeleteProjectIntegrationTest}를 함께 확장하세요.
     * <p>
     * 현재 제거 대상(순서 유지 — 메시지가 채팅방을 참조하므로 메시지를 먼저 삭제):
     * {@link com.devnear.web.domain.chat.ChatMessage},
     * {@link com.devnear.web.domain.chat.ChatRoom},
     * {@link com.devnear.web.domain.proposal.Proposal},
     * {@link com.devnear.web.domain.application.ProjectApplication},
     * {@link com.devnear.web.domain.bookmark.BookmarkProject},
     * {@link com.devnear.web.domain.payment.Payment},
     * {@link com.devnear.web.domain.review.ClientReview},
     * {@link com.devnear.web.domain.review.FreelancerReview}.
     * {@link com.devnear.web.domain.project.ProjectSkill} 등 프로젝트 엔티티에 cascade된 자식은
     * {@link ProjectRepository#delete(Object)} 시 JPA가 처리합니다.
     */
    private void deleteProjectDependents(Long projectId) {
        chatMessageRepository.deleteByProjectId(projectId);
        chatRoomRepository.deleteByProjectId(projectId);
        proposalRepository.deleteByProjectId(projectId);
        projectApplicationRepository.deleteByProjectId(projectId);
        bookmarkProjectRepository.deleteByProjectId(projectId);
        paymentRepository.deleteByProjectId(projectId);
        clientReviewRepository.deleteByProjectId(projectId);
        freelancerReviewRepository.deleteByProjectId(projectId);
        em.flush();
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getProjectList(User viewer, Pageable pageable) {
        Page<Project> projects = projectRepository.findAll(pageable);
        return mapToResponsesWithCounts(projects, viewer);
    }

    /**
     * 공개 공고 검색. {@code excludeOwnerUserId}가 있으면 해당 사용자(클라이언트 계정)가 올린 공고는 목록에서 제외됩니다.
     * 컨트롤러에서 프리랜서 탐색 등에만 이 값을 넣도록 스코프를 제한합니다.
     */
    @Transactional(readOnly = true)
    public Page<ProjectResponse> searchProjects(User viewer, String keyword, String location, List<String> skills, Boolean online,
                                                 Boolean offline, Long excludeOwnerUserId, Pageable pageable) {
        ProjectSearchCond cond = new ProjectSearchCond();
        cond.setKeyword(keyword);
        cond.setLocation(location);
        cond.setSkillNames(skills);
        cond.setOnline(online);
        cond.setOffline(offline);
        cond.setExcludeOwnerUserId(excludeOwnerUserId);

        Page<Project> projects = projectRepository.search(cond, pageable);
        return mapToResponsesWithCounts(projects, viewer);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getMyProjectList(User user, ProjectStatus status, Pageable pageable) {
        ClientProfile clientProfile = findClientProfileByUser(user);

        Page<Project> projects;
        if (status != null) {
            projects = projectRepository.findAllByClientProfileAndStatus(clientProfile, status, pageable);
        } else {
            projects = projectRepository.findAllByClientProfile(clientProfile, pageable);
        }
        return mapToResponsesWithCounts(projects, user);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getFreelancerProjectList(User viewer, Long freelancerId, ProjectStatus status, Pageable pageable) {
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findById(freelancerId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));

        Page<Project> projects;
        if (status != null) {
            projects = projectRepository.findAllByFreelancerProfileAndStatus(freelancerProfile, status, pageable);
        } else {
            projects = projectRepository.findAllByFreelancerProfile(freelancerProfile, pageable);
        }
        return mapToResponsesWithCounts(projects, viewer);
    }

    private Page<ProjectResponse> mapToResponsesWithCounts(Page<Project> projectPage, User viewer) {
        List<Long> projectIds = projectPage.getContent().stream()
                .map(Project::getId)
                .collect(Collectors.toList());

        Map<Long, Long> countMap = new HashMap<>();
        if (!projectIds.isEmpty()) {
            List<Object[]> counts = projectApplicationRepository.countByProjectIdIn(projectIds);
            for (Object[] row : counts) {
                countMap.put((Long) row[0], (Long) row[1]);
            }
        }

        // 찜 여부 확인
        Set<Long> bookmarkedProjectIds = Collections.emptySet();
        if (viewer != null && viewer.getFreelancerProfile() != null) {
            bookmarkedProjectIds = new HashSet<>(bookmarkProjectRepository.findBookmarkedProjectIds(viewer.getFreelancerProfile().getId()));
        }

        final Set<Long> finalBookmarkedProjectIds = bookmarkedProjectIds;
        return projectPage.map(p -> ProjectResponse.from(
                p,
                countMap.getOrDefault(p.getId(), 0L),
                finalBookmarkedProjectIds.contains(p.getId())
        ));
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(User viewer, Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트 공고를 찾을 수 없습니다. ID: " + projectId));

        long count = projectApplicationRepository.countByProjectId(projectId);

        boolean isBookmarked = false;
        if (viewer != null && viewer.getFreelancerProfile() != null) {
            isBookmarked = bookmarkProjectRepository.existsByProfileIdAndProjectId(viewer.getFreelancerProfile().getId(), project.getId());
        }

        return ProjectResponse.from(project, count, isBookmarked);
    }

    private ClientProfile findClientProfileByUser(User user) {
        return clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 등록되지 않았습니다."));
    }

    private Project findProjectAndValidateOwner(User user, Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 공고를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 공고에 대한 권한이 없습니다.");
        }
        return project;
    }

    private String maskAddress(String address) {
        if (address == null || address.length() < 5) return "****";
        return address.substring(0, 5) + "...(하위 주소 마스킹)";
    }

    @Transactional
    public void closeProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.close();
    }

    @Transactional
    public void startProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.start();
    }

    @Transactional
    public void completeProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.complete();

        FreelancerProfile freelancerProfile = project.getFreelancerProfile();
        if (freelancerProfile != null) {
            freelancerProfile.increaseCompletedProjects();
            freelancerGradeService.refreshGrade(freelancerProfile);
        }

        eventPublisher.publishEvent(new ProjectCompletedNotificationEvent(
                project.getClientProfile().getUser().getId(),
                project.getId(),
                "프로젝트 완료",
                "프로젝트가 완료되었습니다. 리뷰를 작성해 주세요.",
                "/client/mypage?tab=projects"
        ));
    }
}