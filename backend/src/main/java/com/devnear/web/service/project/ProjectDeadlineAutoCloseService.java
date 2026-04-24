package com.devnear.web.service.project;

import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * 공고 마감일이 지난 뒤 {@link ProjectStatus#OPEN} 상태를 정리합니다.
 * <ul>
 *     <li>이미 프리랜서가 매칭된 공고는 그대로 둡니다.</li>
 *     <li>검토 대기({@link ApplicationStatus#PENDING} 지원, {@link ProposalStatus#PENDING} 역제안)가 남아 있으면
 *     클라이언트/프리랜서 처리가 끝날 때까지 OPEN을 유지합니다.</li>
 *     <li>대기 건이 없으면 {@link Project#close()}로 마감합니다.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectDeadlineAutoCloseService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final ProjectRepository projectRepository;
    private final ProjectApplicationRepository applicationRepository;
    private final ProposalRepository proposalRepository;
    private final NotificationService notificationService;

    /**
     * 단건 공고에 대해 마감일·대기 지원/역제안 조건을 보고 필요 시 마감합니다.
     * (지원/역제안 상태 변경 직후 호출)
     */
    @Transactional
    public void tryAutoCloseIfReady(Long projectId) {
        projectRepository.findById(projectId).ifPresent(this::tryCloseIfEligible);
    }

    /**
     * 마감일이 지난 OPEN 공고를 스캔해 일괄 마감합니다. (스케줄러)
     */
    @Transactional
    public void autoCloseAllEligibleOpenProjects() {
        LocalDate today = LocalDate.now(KST);
        List<Project> candidates = projectRepository
                .findAllByStatusAndFreelancerProfileIsNullAndDeadlineBefore(ProjectStatus.OPEN, today);
        int closed = 0;
        for (Project p : candidates) {
            if (tryCloseIfEligible(p)) {
                closed++;
            }
        }
        if (closed > 0) {
            log.info("[ProjectDeadline] 마감일 경과 후 자동 마감 {}건 처리", closed);
        }
    }

    /** @return true if project was closed */
    private boolean tryCloseIfEligible(Project project) {
        if (project.getStatus() != ProjectStatus.OPEN) {
            return false;
        }
        if (project.getFreelancerProfile() != null) {
            return false;
        }
        LocalDate today = LocalDate.now(KST);
        if (!project.getDeadline().isBefore(today)) {
            return false;
        }
        if (applicationRepository.existsByProject_IdAndStatus(project.getId(), ApplicationStatus.PENDING)) {
            return false;
        }
        if (proposalRepository.existsByProject_IdAndStatus(project.getId(), ProposalStatus.PENDING)) {
            return false;
        }
        project.close();
        notificationService.notifyUser(
                project.getClientProfile().getUser().getId(),
                NotificationType.PROJECT_DEADLINE_CLOSED,
                "공고 자동 마감",
                "'" + project.getProjectName() + "' 공고가 마감일 경과로 자동 마감되었습니다.",
                project.getId()
        );
        return true;
    }
}
