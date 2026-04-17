package com.devnear.web.dto.notification;

import com.devnear.web.domain.enums.NotificationType;

import java.time.Instant;

public record NotificationPayload(
        Long notificationId,
        NotificationType type,
        String title,
        String message,
        Long resourceId,
        String url,
        Instant createdAt
) {
    public static NotificationPayload of(
            Long notificationId,
            NotificationType type,
            String title,
            String message,
            Long resourceId,
            String url,
            Instant createdAt
    ) {
        return new NotificationPayload(notificationId, type, title, message, resourceId, url, createdAt);
    }
}
