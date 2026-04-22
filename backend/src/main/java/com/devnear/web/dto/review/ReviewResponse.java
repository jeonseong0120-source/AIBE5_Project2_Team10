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
    private String createdAt;

    public ReviewResponse() {
    }

    public ReviewResponse(Long id, BigDecimal averageScore, String comment, BigDecimal workQuality, BigDecimal deadline, BigDecimal communication, BigDecimal expertise, BigDecimal requirementClarity, BigDecimal paymentReliability, BigDecimal workAttitude, String reviewerNickname, String reviewerProfileImageUrl, String createdAt) {
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