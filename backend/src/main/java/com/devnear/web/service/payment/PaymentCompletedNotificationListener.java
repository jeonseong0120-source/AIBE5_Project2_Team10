package com.devnear.web.service.payment;

import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentCompletedNotificationListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        try {
            notificationService.notifyUser(
                    event.clientUserId(),
                    NotificationType.PAYMENT_COMPLETED,
                    "결제 완료",
                    "결제가 완료되었습니다.",
                    event.projectId()
            );
        } catch (Exception ex) {
            log.warn(
                    "Failed to send payment completed notification (paymentId={}, projectId={}, clientUserId={})",
                    event.paymentId(),
                    event.projectId(),
                    event.clientUserId(),
                    ex
            );
        }
    }
}
