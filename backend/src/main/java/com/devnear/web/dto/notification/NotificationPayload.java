package com.devnear.web.dto.notification;

import com.devnear.web.domain.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationPayload(
        Long notificationId,
        NotificationType type,
        String title,
        String message,
        Long resourceId,
        String url,
        LocalDateTime createdAt
) {
    public static NotificationPayload of(
            Long notificationId,
            NotificationType type,
            String title,
            String message,
            Long resourceId,
            String url,
            LocalDateTime createdAt
    ) {
        return new NotificationPayload(notificationId, type, title, message, resourceId, url, createdAt);
    }
}
