package com.devnear.web.scheduler;

import com.devnear.web.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRetentionScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int RETENTION_DAYS = 30;

    private final NotificationRepository notificationRepository;

    /** 매일 새벽 4시(KST) 기준, 생성일이 30일이 지난 알림을 삭제합니다. */
    @Scheduled(cron = "0 0 4 * * ?", zone = "Asia/Seoul")
    @Transactional
    public void deleteNotificationsOlderThanRetention() {
        LocalDateTime cutoff = LocalDateTime.now(KST).minusDays(RETENTION_DAYS);
        long removed = notificationRepository.deleteByCreatedAtBefore(cutoff);
        if (removed > 0) {
            log.info("[NotificationRetention] {}건의 알림을 삭제했습니다. (기준 시각 이전 생성분)", removed);
        }
    }
}
