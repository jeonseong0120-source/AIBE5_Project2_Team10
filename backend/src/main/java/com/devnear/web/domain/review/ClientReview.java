package com.devnear.web.domain.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(
name = "client_review",
uniqueConstraints = @UniqueConstraint(
name = "uk_client_review_project_reviewer_target",
columnNames = {"project_id", "reviewer_freelancer_id", "client_id"}
        )
        )
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClientReview extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "client_review_id")
    private Long id;
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_freelancer_id", nullable = false)
    private FreelancerProfile reviewerFreelancer;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientProfile client;

    @Column(name = "requirement_clarity", nullable = false, precision = 2, scale = 1)
    private BigDecimal requirementClarity;

    @Column(name = "communication", nullable = false, precision = 2, scale = 1)
    private BigDecimal communication;

    @Column(name = "payment_reliability", nullable = false, precision = 2, scale = 1)
    private BigDecimal paymentReliability;

    @Column(name = "work_attitude", nullable = false, precision = 2, scale = 1)
    private BigDecimal workAttitude;

    @Column(name = "average_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageScore;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Builder
    public ClientReview(Long projectId,
                        FreelancerProfile reviewerFreelancer,
                        ClientProfile client,
                        BigDecimal requirementClarity,
                        BigDecimal communication,
                        BigDecimal paymentReliability,
                        BigDecimal workAttitude,
                        String comment) {
        this.projectId = projectId;
        this.reviewerFreelancer = reviewerFreelancer;
        this.client = client;
        this.requirementClarity = requirementClarity;
        this.communication = communication;
        this.paymentReliability = paymentReliability;
        this.workAttitude = workAttitude;
        this.averageScore = calculateAverageScore(requirementClarity, communication, paymentReliability, workAttitude);
        this.comment = comment;
    }

    public void update(BigDecimal requirementClarity,
                       BigDecimal communication,
                       BigDecimal paymentReliability,
                       BigDecimal workAttitude,
                       String comment) {
        this.requirementClarity = requirementClarity;
        this.communication = communication;
        this.paymentReliability = paymentReliability;
        this.workAttitude = workAttitude;
        this.averageScore = calculateAverageScore(requirementClarity, communication, paymentReliability, workAttitude);
        this.comment = comment;
    }

    private BigDecimal calculateAverageScore(BigDecimal requirementClarity,
                                             BigDecimal communication,
                                             BigDecimal paymentReliability,
                                             BigDecimal workAttitude) {
        BigDecimal sum = requirementClarity.add(communication).add(paymentReliability).add(workAttitude);
        return sum.divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP);
    }
}