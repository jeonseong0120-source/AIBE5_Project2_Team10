package com.devnear.web.dto.notification;

import com.devnear.web.domain.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationPayload(
        NotificationType type,
        String title,
        String message,
        Long resourceId,
        LocalDateTime createdAt
) {
    public static NotificationPayload of(NotificationType type, String title, String message, Long resourceId) {
        return new NotificationPayload(type, title, message, resourceId, LocalDateTime.now());
    }
}
