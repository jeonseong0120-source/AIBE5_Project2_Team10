package com.devnear.web.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPrepareRequest {
    private String orderId;
    private Long amount;
    private String orderName;
    private Long projectId;
}
