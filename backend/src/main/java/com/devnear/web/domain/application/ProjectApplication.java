package com.devnear.web.domain.application;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.project.Project;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 프리랜서가 프로젝트에 지원한 내역(지원서)을 저장하는 테이블입니다.
 * 동일인이 같은 공고에 두 번 지원하지 못하도록 UK_APPLICATION 유니크 키를 적용했습니다.
 */
@Entity
@Table(name = "Applications", uniqueConstraints = {
        @UniqueConstraint(name = "UK_APPLICATION", columnNames = { "project_id", "freelancer_id" })
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ProjectApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long id;

    // 해당 지원건의 연결 프로젝트
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // 지원한 프리랜서
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    // 프로젝트를 올린 원청(클라이언트) - 빠른 조회를 위해 관계 설정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientProfile clientProfile;

    // 프리랜서가 부른 희망 단가/페이
    @Column(name = "bid_price", nullable = false)
    private Integer bidPrice;

    // 프리랜서의 지원 멘트(자기소개)
    @Column(columnDefinition = "TEXT")
    private String message;

    // 현재 지원 상태 (대기/수락/거절 등)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    @Column(name = "matching_rate", nullable = false, columnDefinition = "DECIMAL(5,2)")
    private Double matchingRate;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public ProjectApplication(Project project, FreelancerProfile freelancerProfile,
            ClientProfile clientProfile, Integer bidPrice, String message, Double matchingRate) {
        this.project = project;
        this.freelancerProfile = freelancerProfile;
        this.clientProfile = clientProfile;
        this.bidPrice = bidPrice;
        this.message = message;
        this.status = ApplicationStatus.PENDING;
        this.matchingRate = (matchingRate == null) ? 0.0 : matchingRate;
    }

    public void updateStatus(ApplicationStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("지원 상태(status)는 null일 수 없습니다.");
        }
        this.status = status;
    }

}
