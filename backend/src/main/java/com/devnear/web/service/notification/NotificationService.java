package com.devnear.web.service.notification;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.dto.notification.NotificationPayload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final String USER_TOPIC_PREFIX = "/sub/notifications/users/";
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyUser(Long userId, NotificationType type, String title, String message, Long resourceId) {
        if (userId == null) {
            return;
        }
        NotificationPayload payload = NotificationPayload.of(type, title, message, resourceId);
        messagingTemplate.convertAndSend(USER_TOPIC_PREFIX + userId, payload);
    }
}
