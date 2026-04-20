package com.devnear.web.dto.payment;

import com.devnear.web.domain.payment.Payment;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponse {
    private String orderId;
    private String orderName;
    private Long amount;
    private Long fee;
    private Long netAmount;
    private String status;
    private String method;

    public static PaymentResponse from(Payment payment) {
        return PaymentResponse.builder()
                .orderId(payment.getOrderId())
                .orderName(payment.getOrderName())
                .amount(payment.getAmount())
                .fee(payment.getFee())
                .netAmount(payment.getNetAmount())
                .status(payment.getStatus().name())
                .method(payment.getMethod())
                .build();
    }
}
