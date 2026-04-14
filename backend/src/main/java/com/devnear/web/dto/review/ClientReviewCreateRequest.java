package com.devnear.web.dto.review;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class ClientReviewCreateRequest {

    private Long projectId;
    private Long clientId;

    private BigDecimal requirementClarity;
    private BigDecimal communication;
    private BigDecimal paymentReliability;
    private BigDecimal workAttitude;

    private String comment;
}