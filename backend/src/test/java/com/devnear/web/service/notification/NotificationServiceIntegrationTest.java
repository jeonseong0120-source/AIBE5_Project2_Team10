package com.devnear.web.service.notification;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.notification.Notification;
import com.devnear.web.domain.notification.NotificationRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.notification.NotificationInboxResponse;
import com.devnear.test.config.QueryCountingTestConfiguration;
import com.devnear.test.support.QueryCountExtension;
import com.devnear.test.support.QueryCountHolder;
import com.devnear.web.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Import(QueryCountingTestConfiguration.class)
@ExtendWith(QueryCountExtension.class)
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

        QueryCountHolder.reset();
        NotificationInboxResponse inbox = notificationService.getInbox(user.getId(), PageRequest.of(0, 10));
        assertThat(QueryCountHolder.selectExecutions())
                .as("인박스 조회(getInbox: 미읽음 카운트+페이지)는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);
        assertThat(inbox.unreadCount()).isEqualTo(1);
        assertThat(inbox.content()).hasSize(1);
        assertThat(inbox.content().get(0).title()).isEqualTo("새 공고 지원");
        assertThat(inbox.content().get(0).read()).isFalse();

        Long id = inbox.content().get(0).notificationId();
        notificationService.markNotificationRead(user.getId(), id);

        Notification persisted = notificationRepository.findById(id).orElseThrow();
        assertThat(persisted.isRead()).isTrue();

        QueryCountHolder.reset();
        assertThat(notificationService.getInbox(user.getId(), PageRequest.of(0, 10)).unreadCount()).isEqualTo(0);
        assertThat(QueryCountHolder.selectExecutions())
                .as("읽음 처리 후 인박스 재조회도 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);
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

        QueryCountHolder.reset();
        assertThat(notificationService.getInbox(user.getId(), PageRequest.of(0, 10), true).content()).hasSize(1);
        assertThat(QueryCountHolder.selectExecutions())
                .as("미읽음만 인박스 조회는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);

        notificationService.markNotificationRead(user.getId(), id);
        notificationRepository.flush();

        QueryCountHolder.reset();
        assertThat(notificationService.getInbox(user.getId(), PageRequest.of(0, 10), true).content()).isEmpty();
        assertThat(QueryCountHolder.selectExecutions())
                .as("읽음 처리 후 미읽음 전용 인박스는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);

        QueryCountHolder.reset();
        assertThat(notificationService.getInbox(user.getId(), PageRequest.of(0, 10), false).content()).hasSize(1);
        assertThat(QueryCountHolder.selectExecutions())
                .as("전체 인박스 조회도 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(6);
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

        QueryCountHolder.reset();
        assertThatThrownBy(() -> notificationService.markNotificationRead(b.getId(), nid))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(QueryCountHolder.selectExecutions())
                .as("타인 알림 읽음 처리 실패 시 조회는 소수의 SELECT")
                .isPositive()
                .isLessThanOrEqualTo(4);
    }
}
