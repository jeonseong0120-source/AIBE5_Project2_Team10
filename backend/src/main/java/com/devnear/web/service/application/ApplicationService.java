package com.devnear.web.service.application;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.ProjectStatus; // 🎯 봇의 요청대로 임포트 추가
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.application.ApplicationRequest;
import com.devnear.web.dto.application.ApplicantResponse;
import com.devnear.web.dto.application.ApplicationStatusUpdateRequest;
import com.devnear.web.dto.application.MyApplicationResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.exception.ResourceConflictException; // 🎯 충돌 예외 임포트 추가
import com.devnear.web.service.notification.NotificationService;
import com.devnear.web.service.project.ProjectDeadlineAutoCloseService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.PessimisticLockingFailureException; // 🎯 락 실패 예외 임포트 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.devnear.web.domain.proposal.ProposalRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ProjectApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final NotificationService notificationService;
    private final ProposalRepository proposalRepository;
    private final ProjectDeadlineAutoCloseService projectDeadlineAutoCloseService;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /**
     * [FRE-04] 프리랜서가 특정 프로젝트에 지원서를 제출합니다.
     */
    @Transactional
    public Long applyToProject(User user, ApplicationRequest request) {
        // 1. 지원 자격 확인 (프리랜서 프로필 등록 여부)
        FreelancerProfile freelancer = freelancerProfileRepository.findByUserIdWithSkills(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프리랜서 프로필이 등록되어 있지 않습니다."));

        // 2. 프로젝트 존재 여부 및 모집 상태 검증
        Project project = projectRepository.findByIdWithClientProfile(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("지원하려는 프로젝트(공고)를 찾을 수 없습니다."));

        if (project.getStatus() != ProjectStatus.OPEN || project.getFreelancerProfile() != null) {
            throw new IllegalStateException("현재 모집 중이 아니거나 이미 매칭(결제 대기)이 완료된 공고입니다. (지원 불가)");
        }

        LocalDate today = LocalDate.now(KST);
        if (project.getDeadline().isBefore(today)) {
            throw new IllegalStateException("마감일이 지난 공고에는 지원할 수 없습니다.");
        }

        // 2.5 동일 계정(BOTH 등): 본인이 올린 공고에 프리랜서로 지원 불가
        Long projectOwnerUserId = project.getClientProfile().getUser().getId();
        if (projectOwnerUserId.equals(user.getId())) {
            throw new IllegalArgumentException("본인이 등록한 공고에는 지원할 수 없습니다. (CANNOT_APPLY_OWN_PROJECT)");
        }

        // 3. 중복 지원 방지
        if (applicationRepository.existsByProjectIdAndFreelancerProfileId(project.getId(), freelancer.getId())) {
            throw new IllegalArgumentException("이미 이 공고에 지원했습니다. (ALREADY_APPLIED)");
        }

        // 3.5 지원 시점 매칭률 계산 (프로젝트 스킬 대비 일치율)
        Double matchingRate = calculateMatchingRate(project, freelancer);

        // 4. 지원서 객체 생성 및 저장
        ProjectApplication application = ProjectApplication.builder()
                .project(project)
                .freelancerProfile(freelancer)
                .clientProfile(project.getClientProfile())
                .bidPrice(request.getBidPrice())
                .message(request.getMessage())
                .matchingRate(matchingRate)
                .build();

        Long applicationId = applicationRepository.save(application).getId();

        notificationService.notifyUser(
                project.getClientProfile().getUser().getId(),
                NotificationType.PROJECT_APPLICATION_SUBMITTED,
                "새 공고 지원",
                freelancer.getUser().getNickname() + " 님이 '" + project.getProjectName() + "' 공고에 지원했습니다.",
                applicationId
        );

        return applicationId;
    }

    /**
     * [FRE-05] 프리랜서 본인이 여태 지원한 지원 내역(대시보드)을 조회합니다.
     */
    public List<MyApplicationResponse> getMyApplications(User user) {
        FreelancerProfile freelancer = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프리랜서 프로필이 등록되어 있지 않습니다."));

        // 1. 일반 지원 내역
        List<MyApplicationResponse> applications = applicationRepository.findByFreelancerProfileIdWithProject(freelancer.getId()).stream()
                .map(MyApplicationResponse::from)
                .collect(Collectors.toList());

        // 2. 수락된 역제안 중 결제 완료(진행 중 이상)된 내역 추가
        List<MyApplicationResponse> proposals = proposalRepository.findAcceptedReceivedProposalsByFreelancerId(freelancer.getId()).stream()
                .map(MyApplicationResponse::from)
                .collect(Collectors.toList());

        List<MyApplicationResponse> combined = new ArrayList<>(applications);
        combined.addAll(proposals);

        // 최신순 정렬 (지원일 기준)
        return combined.stream()
                .sorted(Comparator.comparing(MyApplicationResponse::getAppliedAt).reversed())
                .collect(Collectors.toList());
    }

    /**
     * [CLI] 클라이언트가 특정 프로젝트의 지원자 목록을 매칭률 높은 순으로 조회합니다.
     */
    public List<ApplicantResponse> getApplicantsForMyProject(User user, Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 공고를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 공고에 대한 권한이 없습니다.");
        }

        // 1. 일반 지원자 목록 가져오기
        List<ApplicantResponse> applications = applicationRepository.findByProjectIdWithFreelancerSorted(projectId).stream()
                .map(ApplicantResponse::from)
                .toList();

        // 2. 역제안 대상자 목록 가져오기
        List<ApplicantResponse> proposals = proposalRepository.findAllByProjectId(projectId).stream()
                .map(ApplicantResponse::from)
                .toList();

        // 3. 병합 및 정렬 (역제안 대상자 상단 고정 -> 매칭률 내림차순)
        List<ApplicantResponse> combined = new ArrayList<>();
        combined.addAll(proposals);
        combined.addAll(applications);

        return combined.stream()
                .sorted(Comparator.comparing(ApplicantResponse::getSource, Comparator.reverseOrder()) // PROPOSAL(P) > APPLICATION(A)
                        .thenComparing(ApplicantResponse::getMatchingRate, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    /**
     * [CLI] 클라이언트가 지원 상태를 수락/거절로 업데이트합니다.
     */
    @Transactional
    public void updateApplicationStatus(User user, Long applicationId, ApplicationStatusUpdateRequest request) {
        ApplicationStatus newStatus = request.toStatus();
        if (newStatus != ApplicationStatus.ACCEPTED && newStatus != ApplicationStatus.REJECTED) {
            throw new IllegalArgumentException("지원 상태는 ACCEPTED 또는 REJECTED만 가능합니다.");
        }

        ProjectApplication application = applicationRepository.findByIdWithProjectAndClient(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("지원서를 찾을 수 없습니다. id=" + applicationId));

        if (!application.getProject().getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 지원서에 대한 권한이 없습니다.");
        }

        application.updateStatus(newStatus);

        Long freelancerUserId = application.getFreelancerProfile().getUser().getId();
        if (newStatus == ApplicationStatus.ACCEPTED) {
            notificationService.notifyUser(
                    freelancerUserId,
                    NotificationType.PROJECT_APPLICATION_ACCEPTED,
                    "공고 지원 수락",
                    "'" + application.getProject().getProjectName() + "' 공고 지원이 수락되었습니다.",
                    application.getId()
            );
        } else {
            notificationService.notifyUser(
                    freelancerUserId,
                    NotificationType.PROJECT_APPLICATION_REJECTED,
                    "공고 지원 거절",
                    "'" + application.getProject().getProjectName() + "' 공고 지원이 거절되었습니다.",
                    application.getId()
            );
        }

        // 🎯 [핵심 수정] 지원자 수락 시 동시성 제어(비관적 락) 및 상태 이중 검증
        if (newStatus == ApplicationStatus.ACCEPTED) {
            try {
                // 1. 비관적 락을 걸고 최신 상태의 프로젝트를 가져옵니다.
                Project project = projectRepository.findByIdForUpdate(application.getProject().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("해당 공고를 찾을 수 없습니다."));

                // 2. 이미 매칭된 프리랜서가 있거나, 프로젝트 상태가 모집중(OPEN)이 아니라면 튕겨냅니다.
                if (project.getStatus() != ProjectStatus.OPEN || project.getFreelancerProfile() != null) {
                    throw new ResourceConflictException("이미 다른 프리랜서와 매칭이 완료되었거나 모집 중인 공고가 아닙니다.");
                }

                // 3. 안전하게 할당 후 상태 유지 (결제 후 진행중으로 변경됨)
                project.assignFreelancer(application.getFreelancerProfile());

            } catch (PessimisticLockingFailureException e) {
                // 4. 누군가 이미 락을 선점해서 처리 중일 때의 예외 처리
                throw new ResourceConflictException("현재 다른 사용자가 매칭을 처리 중입니다. 잠시 후 다시 시도해주세요.");
            }
        }

        projectDeadlineAutoCloseService.tryAutoCloseIfReady(application.getProject().getId());
    }

    private Double calculateMatchingRate(Project project, FreelancerProfile freelancer) {
        if (project.getProjectSkills() == null || project.getProjectSkills().isEmpty()) {
            return 0.0;
        }

        Set<Long> projectSkillIds = project.getProjectSkills().stream()
                .map(ps -> ps.getSkill().getId())
                .collect(Collectors.toSet());

        if (freelancer.getFreelancerSkills() == null || freelancer.getFreelancerSkills().isEmpty()) {
            return 0.0;
        }

        long matched = freelancer.getFreelancerSkills().stream()
                .map(fs -> fs.getSkill().getId())
                .filter(projectSkillIds::contains)
                .distinct()
                .count();

        double rate = (matched * 100.0) / projectSkillIds.size();

        return BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}