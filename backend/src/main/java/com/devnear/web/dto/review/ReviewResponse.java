package com.devnear.web.dto.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private BigDecimal averageScore;
    private String comment;
    private BigDecimal workQuality;
    private BigDecimal deadline;
    private BigDecimal communication;
    private BigDecimal expertise;
    private BigDecimal requirementClarity;
    private BigDecimal paymentReliability;
    private BigDecimal workAttitude;
}