package com.devnear.web.service.payment;

/**
 * 결제 확정 커밋 이후 알림 등 부가 처리용(본 트랜잭션과 분리).
 */
public record PaymentCompletedEvent(Long paymentId, Long projectId, Long clientUserId) {
}
