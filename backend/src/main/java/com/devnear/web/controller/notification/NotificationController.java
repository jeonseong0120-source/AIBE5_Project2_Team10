package com.devnear.web.controller.notification;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.notification.NotificationInboxResponse;
import com.devnear.web.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Notification", description = "알림 조회 및 읽음 처리")
@RestController
@RequestMapping(value = {"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "내 알림 목록", description = "최신순 페이지와 미읽음 개수를 반환합니다. unreadOnly=true이면 읽지 않은 알림만 반환합니다.")
    @GetMapping
    public ResponseEntity<NotificationInboxResponse> list(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(notificationService.getInbox(user, pageable, unreadOnly));
    }

    @Operation(summary = "알림 읽음 처리", description = "본인 알림만 읽음으로 표시합니다.")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId
    ) {
        notificationService.markNotificationRead(user, notificationId);
        return ResponseEntity.noContent().build();
    }
}
