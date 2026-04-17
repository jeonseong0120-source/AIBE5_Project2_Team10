package com.devnear.web.service.application;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.enums.NotificationType;
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
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ProjectApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final NotificationService notificationService;

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

        if (project.getStatus() != com.devnear.web.domain.enums.ProjectStatus.OPEN) {
            throw new IllegalStateException("현재 모집 중인 공고가 아닙니다. (지원 불가)");
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

        // Repository에서 N+1 최적화된 쿼리로 꺼내서 DTO로 변환
        return applicationRepository.findByFreelancerProfileIdWithProject(freelancer.getId()).stream()
                .map(MyApplicationResponse::from)
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

        return applicationRepository.findByProjectIdWithFreelancerSorted(projectId).stream()
                .map(ApplicantResponse::from)
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
