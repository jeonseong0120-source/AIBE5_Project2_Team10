package com.devnear.web.service.notification;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.notification.Notification;
import com.devnear.web.domain.notification.NotificationRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.notification.NotificationInboxResponse;
import com.devnear.web.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class NotificationServiceIntegrationTest {

    @Autowired
    private NotificationService notificationService;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    void notifyUser_thenInbox_thenMarkRead() {
        User user = userRepository.save(User.builder()
                .email("notif-" + UUID.randomUUID() + "@test.dev")
                .password("pw")
                .name("테스트")
                .nickname("nick-" + UUID.randomUUID().toString().substring(0, 8))
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("p-" + UUID.randomUUID())
                .build());

        notificationService.notifyUser(
                user.getId(),
                NotificationType.PROJECT_APPLICATION_SUBMITTED,
                "새 공고 지원",
                "본문 메시지",
                99L
        );
        notificationRepository.flush();

        assertThat(notificationRepository.countUnreadByUserId(user.getId())).isEqualTo(1);

        NotificationInboxResponse inbox = notificationService.getInbox(user, PageRequest.of(0, 10));
        assertThat(inbox.unreadCount()).isEqualTo(1);
        assertThat(inbox.content()).hasSize(1);
        assertThat(inbox.content().get(0).title()).isEqualTo("새 공고 지원");
        assertThat(inbox.content().get(0).read()).isFalse();

        Long id = inbox.content().get(0).notificationId();
        notificationService.markNotificationRead(user, id);

        Notification persisted = notificationRepository.findById(id).orElseThrow();
        assertThat(persisted.isRead()).isTrue();
        assertThat(notificationService.getInbox(user, PageRequest.of(0, 10)).unreadCount()).isEqualTo(0);
    }

    @Test
    void getInbox_unreadOnly_excludesRead() {
        User user = userRepository.save(User.builder()
                .email("notif-unread-" + UUID.randomUUID() + "@test.dev")
                .password("pw")
                .name("테스트")
                .nickname("nu-" + UUID.randomUUID().toString().substring(0, 8))
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pu-" + UUID.randomUUID())
                .build());

        notificationService.notifyUser(user.getId(), NotificationType.PAYMENT_COMPLETED, "A", "m1", 1L);
        notificationRepository.flush();
        Long id = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 1))
                .getContent().get(0).getId();

        assertThat(notificationService.getInbox(user, PageRequest.of(0, 10), true).content()).hasSize(1);

        notificationService.markNotificationRead(user, id);
        notificationRepository.flush();

        assertThat(notificationService.getInbox(user, PageRequest.of(0, 10), true).content()).isEmpty();
        assertThat(notificationService.getInbox(user, PageRequest.of(0, 10), false).content()).hasSize(1);
    }

    @Test
    void markRead_otherUser_throwsNotFound() {
        User a = userRepository.save(User.builder()
                .email("a-" + UUID.randomUUID() + "@test.dev")
                .password("pw")
                .name("A")
                .nickname("na-" + UUID.randomUUID().toString().substring(0, 8))
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pa-" + UUID.randomUUID())
                .build());
        User b = userRepository.save(User.builder()
                .email("b-" + UUID.randomUUID() + "@test.dev")
                .password("pw")
                .name("B")
                .nickname("nb-" + UUID.randomUUID().toString().substring(0, 8))
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("pb-" + UUID.randomUUID())
                .build());

        notificationService.notifyUser(a.getId(), NotificationType.CHAT_ROOM_CREATED, "채팅", "내용", 1L);
        notificationRepository.flush();
        Long nid = notificationRepository.findByUser_IdOrderByCreatedAtDesc(a.getId(), PageRequest.of(0, 1))
                .getContent().get(0).getId();

        assertThatThrownBy(() -> notificationService.markNotificationRead(b, nid))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
