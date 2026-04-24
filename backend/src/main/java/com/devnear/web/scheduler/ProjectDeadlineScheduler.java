package com.devnear.web.scheduler;

import com.devnear.web.service.project.ProjectDeadlineAutoCloseService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ProjectDeadlineScheduler {

    private final ProjectDeadlineAutoCloseService projectDeadlineAutoCloseService;

    /** 매일 00:10 KST — 마감일 다음 날부터 대기 지원/역제안이 없으면 자동 마감 */
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Seoul")
    @Transactional
    public void closeExpiredOpenProjects() {
        projectDeadlineAutoCloseService.autoCloseAllEligibleOpenProjects();
    }
}
