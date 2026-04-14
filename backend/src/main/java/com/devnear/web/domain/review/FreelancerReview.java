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
name = "freelancer_review",
uniqueConstraints = @UniqueConstraint(
name = "uk_freelancer_review_project_reviewer_target",
columnNames = {"project_id", "reviewer_client_id", "freelancer_id"}
        )
        )
        @Getter
        @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FreelancerReview extends BaseTimeEntity {
    @Id
            @GeneratedValue(strategy = GenerationType.IDENTITY)
            @Column(name = "freelancer_review_id")
    private Long id;
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    @ManyToOne(fetch = FetchType.LAZY)
            @JoinColumn(name = "reviewer_client_id", nullable = false)
    private ClientProfile reviewerClient;
    @ManyToOne(fetch = FetchType.LAZY)
            @JoinColumn(name = "freelancer_id", nullable = false)
    private FreelancerProfile freelancer;

    @Column(name = "work_quality", nullable = false, precision = 2, scale = 1)
    private BigDecimal workQuality;

    @Column(name = "deadline", nullable = false, precision = 2, scale = 1)
    private BigDecimal deadline;

    @Column(name = "communication", nullable = false, precision = 2, scale = 1)
    private BigDecimal communication;

    @Column(name = "expertise", nullable = false, precision = 2, scale = 1)
    private BigDecimal expertise;

    @Column(name = "average_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageScore;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Builder
    public FreelancerReview(Long projectId,
                            ClientProfile reviewerClient,
                            FreelancerProfile freelancer,
                            BigDecimal workQuality,
                            BigDecimal deadline,
                            BigDecimal communication,
                            BigDecimal expertise,
                            String comment) {
        this.projectId = projectId;
        this.reviewerClient = reviewerClient;
        this.freelancer = freelancer;
        this.workQuality = workQuality;
        this.deadline = deadline;
        this.communication = communication;
        this.expertise = expertise;
        this.averageScore = calculateAverageScore(workQuality, deadline, communication, expertise);
        this.comment = comment;
    }

    public void update(BigDecimal workQuality,
                       BigDecimal deadline,
                       BigDecimal communication,
                       BigDecimal expertise,
                       String comment) {
        this.workQuality = workQuality;
        this.deadline = deadline;
        this.communication = communication;
        this.expertise = expertise;
        this.averageScore = calculateAverageScore(workQuality, deadline, communication, expertise);
        this.comment = comment;
    }

    private BigDecimal calculateAverageScore(BigDecimal workQuality,
                                             BigDecimal deadline,
                                             BigDecimal communication,
                                             BigDecimal expertise) {
        BigDecimal sum = workQuality.add(deadline).add(communication).add(expertise);
        return sum.divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP);
    }
}