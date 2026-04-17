package com.devnear.web.dto.notification;

import org.springframework.data.domain.Page;

import java.util.List;

public record NotificationInboxResponse(
        long unreadCount,
        List<NotificationResponse> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        boolean last
) {
    public static NotificationInboxResponse of(long unreadCount, Page<NotificationResponse> page) {
        return new NotificationInboxResponse(
                unreadCount,
                List.copyOf(page.getContent()),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.isLast()
        );
    }
}
