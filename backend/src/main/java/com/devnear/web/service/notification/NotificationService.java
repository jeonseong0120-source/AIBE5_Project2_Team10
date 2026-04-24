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

import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String USER_TOPIC_PREFIX = "/sub/notifications/users/";
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * [수정] User 엔티티 대신 userId(Long)를 직접 받도록 변경
     */
    @Transactional(readOnly = true)
    public NotificationInboxResponse getInbox(Long userId, Pageable pageable) {
        return getInbox(userId, pageable, false);
    }

    @Transactional(readOnly = true)
    public NotificationInboxResponse getInbox(Long userId, Pageable pageable, boolean unreadOnly) {
        long unread = notificationRepository.countUnreadByUserId(userId);
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByUser_IdAndReadIsFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        return NotificationInboxResponse.of(unread, page.map(NotificationResponse::fromEntity));
    }

    /**
     * [수정] User 엔티티 대신 userId(Long)를 직접 받도록 변경
     */
    @Transactional
    public void markNotificationRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다."));

        if (!notification.isRead()) {
            notification.markRead();
        }
    }

    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String message, Long resourceId) {
        notifyUser(userId, type, title, message, resourceId, null);
    }

    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String message, Long resourceId, String urlOverride) {
        if (userId == null) {
            throw new IllegalArgumentException("수신자 userId는 null일 수 없습니다.");
        }

        Objects.requireNonNull(type, "알림 타입은 null일 수 없습니다.");
        Objects.requireNonNull(title, "알림 제목은 null일 수 없습니다.");
        Objects.requireNonNull(message, "알림 메시지는 null일 수 없습니다.");

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("수신자를 찾을 수 없습니다."));

        String content = title + "\n" + message;
        String url = (urlOverride != null && !urlOverride.isBlank())
                ? urlOverride
                : buildUrl(type, resourceId);
        Notification saved = notificationRepository.save(Notification.builder()
                .user(targetUser)
                .notificationType(type)
                .content(content)
                .read(false)
                .url(url)
                .build());

        Instant at = saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now();

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
            case CHAT_ROOM_CREATED -> null;
            case PROJECT_PROPOSAL_SENT -> "/freelancer/mypage";
            case PROJECT_PROPOSAL_ACCEPTED, PROJECT_PROPOSAL_REJECTED -> null;
            case PROJECT_APPLICATION_SUBMITTED -> "/client/dashboard";
            case PROJECT_APPLICATION_ACCEPTED, PROJECT_APPLICATION_REJECTED -> null;
            case PROJECT_COMPLETED_REVIEW_REQUEST -> "/client/mypage?tab=projects";
            case PAYMENT_COMPLETED -> "/client/dashboard";
            case FREELANCER_DEPOSIT_COMPLETED -> resourceId == null
                    ? "/freelancer/mypage?tab=settlement"
                    : "/freelancer/mypage?tab=settlement&projectId=" + resourceId;
            case REVIEW_LEFT_BY_CLIENT -> "/freelancer/mypage?tab=reviews";
            case REVIEW_LEFT_BY_FREELANCER -> "/client/mypage?tab=projects";
            case COMMUNITY_COMMENT_ON_MY_POST -> "/community/" + resourceId;
            case PROJECT_DEADLINE_CLOSED -> "/client/dashboard";
        };
    }
}