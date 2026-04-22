package com.devnear.web.scheduler;

import com.devnear.web.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRetentionScheduler {

    private static final int RETENTION_DAYS = 30;

    private final NotificationRepository notificationRepository;

    /** 매일 새벽 4시(KST)에 실행. 보존 기간은 UTC 기준 Instant로 계산해 {@code created_at}과 동일한 시간 축으로 비교합니다. */
    @Scheduled(cron = "0 0 4 * * ?", zone = "Asia/Seoul")
    @Transactional
    public void deleteNotificationsOlderThanRetention() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);
        long removed = notificationRepository.deleteByCreatedAtBefore(cutoff);
        if (removed > 0) {
            log.info("[NotificationRetention] {}건의 알림을 삭제했습니다. (기준 시각 이전 생성분)", removed);
        }
    }
}
