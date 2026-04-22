package com.devnear.web.dto.review;

import lombok.Getter;
import java.math.BigDecimal;

@Getter
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
    private String reviewerNickname;
    private String reviewerProfileImageUrl;
    private java.time.LocalDateTime createdAt;

    public ReviewResponse() {
    }

    public ReviewResponse(Long id, java.math.BigDecimal averageScore, String comment, java.math.BigDecimal workQuality, java.math.BigDecimal deadline, java.math.BigDecimal communication, java.math.BigDecimal expertise, java.math.BigDecimal requirementClarity, java.math.BigDecimal paymentReliability, java.math.BigDecimal workAttitude, String reviewerNickname, String reviewerProfileImageUrl, java.time.LocalDateTime createdAt) {
        this.id = id;
        this.averageScore = averageScore;
        this.comment = comment;
        this.workQuality = workQuality;
        this.deadline = deadline;
        this.communication = communication;
        this.expertise = expertise;
        this.requirementClarity = requirementClarity;
        this.paymentReliability = paymentReliability;
        this.workAttitude = workAttitude;
        this.reviewerNickname = reviewerNickname;
        this.reviewerProfileImageUrl = reviewerProfileImageUrl;
        this.createdAt = createdAt;
    }
}