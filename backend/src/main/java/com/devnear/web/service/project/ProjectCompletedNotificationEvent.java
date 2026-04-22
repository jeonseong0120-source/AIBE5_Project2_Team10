package com.devnear.web.service.project;

/**
 * 프로젝트 완료 처리 커밋 이후 클라이언트 알림용.
 */
public record ProjectCompletedNotificationEvent(
        Long clientUserId,
        Long projectId,
        String title,
        String message,
        String urlOverride
) {
}
