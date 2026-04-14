package com.devnear.web.dto.review;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class FreelancerReviewCreateRequest {

    private Long projectId;
    private Long freelancerId;

    private BigDecimal workQuality;
    private BigDecimal deadline;
    private BigDecimal communication;
    private BigDecimal expertise;

    private String comment;
}