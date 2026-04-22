package com.devnear.web.service.project;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectCompletedNotificationListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProjectCompleted(ProjectCompletedNotificationEvent event) {
        try {
            notificationService.notifyUser(
                    event.clientUserId(),
                    NotificationType.PROJECT_COMPLETED_REVIEW_REQUEST,
                    event.title(),
                    event.message(),
                    event.projectId(),
                    event.urlOverride()
            );
        } catch (Exception ex) {
            log.warn(
                    "Failed to send project completed notification (projectId={}, clientUserId={})",
                    event.projectId(),
                    event.clientUserId(),
                    ex
            );
        }
    }
}
