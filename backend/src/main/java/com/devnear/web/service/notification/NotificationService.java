package com.devnear.web.service.notification;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.notification.Notification;
import com.devnear.web.domain.notification.NotificationRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.notification.NotificationInboxResponse;
import com.devnear.web.dto.notification.NotificationPayload;
import com.devnear.web.dto.notification.NotificationResponse;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.Objects;

import java.time.Instant;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String USER_TOPIC_PREFIX = "/sub/notifications/users/";
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationInboxResponse getInbox(User user, Pageable pageable) {
        long unread = notificationRepository.countUnreadByUserId(user.getId());
        Page<NotificationResponse> page = notificationRepository
                .findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(NotificationResponse::fromEntity);
        return NotificationInboxResponse.of(unread, page);
    }

    @Transactional
    public void markNotificationRead(User user, Long notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUser_Id(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다."));
        if (!notification.isRead()) {
            notification.markRead();
        }
    }

    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String message, Long resourceId) {
        if (userId == null) {
            throw new IllegalArgumentException("수신자 userId는 null일 수 없습니다.");
        }

        Objects.requireNonNull(type, "알림 타입은 null일 수 없습니다.");
        Objects.requireNonNull(title, "알림 제목은 null일 수 없습니다.");
        Objects.requireNonNull(message, "알림 메시지는 null일 수 없습니다.");
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("수신자를 찾을 수 없습니다."));
        String content = title + "\n" + message;
        Notification saved = notificationRepository.save(Notification.builder()
                .user(targetUser)
                .notificationType(type)
                .content(content)
                .read(false)
                .url(buildUrl(type, resourceId))
                .build());
        Instant at = saved.getCreatedAt() != null
                ? saved.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant()
                : Instant.now();
        NotificationPayload payload = NotificationPayload.of(
                saved.getId(),
                type,
                title,
                message,
                resourceId,
                saved.getUrl(),
                at
        );
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend(USER_TOPIC_PREFIX + userId, payload);
            }
        });
    }

    private static String buildUrl(NotificationType type, Long resourceId) {
        if (resourceId == null) {
            return null;
        }
        return switch (type) {
            case CHAT_ROOM_CREATED -> "/client/mypage";
            case PROJECT_PROPOSAL_SENT, PROJECT_PROPOSAL_ACCEPTED, PROJECT_PROPOSAL_REJECTED ->
                    "/freelancer/mypage";
            case PROJECT_APPLICATION_SUBMITTED -> "/client/dashboard";
            case PROJECT_APPLICATION_ACCEPTED, PROJECT_APPLICATION_REJECTED -> "/freelancer/mypage";
        };
    }
}
