package com.devnear.web.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentStatus {
    READY("결제 준비"),
    DONE("결제 완료"),
    CANCELED("결제 취소"),
    PURCHASE_CONFIRMED("구매 확정"), // 에스크로 대금 지급 승인됨
    SETTLED("정산 완료"); // 프리랜서에게 최종 지급됨

    private final String description;
}
