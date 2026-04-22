package com.devnear.web.controller.notification;

import com.devnear.global.auth.SecurityUser; // [중요] SecurityUser 임포트
import com.devnear.web.dto.notification.NotificationInboxResponse;
import com.devnear.web.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Notification", description = "알림 조회 및 읽음 처리")
@RestController
@RequestMapping(value = {"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "내 알림 목록", description = "최신순 페이지와 미읽음 개수를 반환합니다.")
    @GetMapping
    public ResponseEntity<NotificationInboxResponse> list(
            @AuthenticationPrincipal SecurityUser principal, // [수정] User -> SecurityUser
            @PageableDefault(size = 20) Pageable pageable
    ) {
        // [수정] principal.getId()만 넘겨줍니다.
        return ResponseEntity.ok(notificationService.getInbox(principal.getId(), pageable));
    }

    @Operation(summary = "알림 읽음 처리", description = "본인 알림만 읽음으로 표시합니다.")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal SecurityUser principal, // [수정] User -> SecurityUser
            @PathVariable Long notificationId
    ) {
        // [수정] principal.getId()만 넘겨줍니다.
        notificationService.markNotificationRead(principal.getId(), notificationId);
        return ResponseEntity.noContent().build();
    }
}