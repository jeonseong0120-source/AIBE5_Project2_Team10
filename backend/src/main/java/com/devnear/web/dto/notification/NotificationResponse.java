package com.devnear.web.dto.notification;

import com.devnear.web.domain.notification.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        String type,
        String title,
        String message,
        String content,
        boolean read,
        String url,
        LocalDateTime createdAt
) {
    public static NotificationResponse fromEntity(Notification n) {
        String c = n.getContent();
        int nl = c.indexOf('\n');
        String title = nl >= 0 ? c.substring(0, nl) : c;
        String message = nl >= 0 ? c.substring(nl + 1) : "";
        return new NotificationResponse(
                n.getId(),
                n.getNotificationType().name(),
                title,
                message,
                c,
                n.isRead(),
                n.getUrl(),
                n.getCreatedAt()
        );
    }
}
