package com.devnear.web.domain.proposal;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ProposalStatus;
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
 * 클라이언트가 프리랜서에게 먼저 역제안(스카우트)을 보내는 테이블입니다.
 * 기존 Applications(프리랜서→클라이언트)와 반대 방향입니다.
 * 동일 프로젝트-프리랜서 조합으로 중복 제안을 방지합니다.
 */
@Entity
@Table(name = "Proposals", uniqueConstraints = {
        @UniqueConstraint(name = "UK_PROPOSAL", columnNames = {"project_id", "freelancer_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "proposal_id")
    private Long id;

    /**
     * JPA 낙관적 락(Optimistic Lock) 버전 필드.
     * 동시에 두 명이 같은 제안을 수락/거절할 때 충돌을 감지합니다.
     */
    @Version
    private Long version;

    public void setVersion(Long version) {
        this.version = version;
    }

    // 어떤 프로젝트에 대한 역제안인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // 역제안을 보낸 클라이언트
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientProfile clientProfile;

    // 역제안 받은 프리랜서
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    // 제안 메시지
    @Column(columnDefinition = "TEXT")
    private String message;

    // 클라이언트가 제시하는 금액
    @Column(name = "offered_price", nullable = false)
    private Integer offeredPrice;

    // 제안 상태 (대기 / 수락 / 거절)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProposalStatus status;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public Proposal(Project project, ClientProfile clientProfile,
                    FreelancerProfile freelancerProfile, String message, Integer offeredPrice) {
        this.project = project;
        this.clientProfile = clientProfile;
        this.freelancerProfile = freelancerProfile;
        this.message = message;
        this.offeredPrice = offeredPrice;
        this.status = ProposalStatus.PENDING;
    }

    public void updateStatus(ProposalStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("제안 상태(status)는 null일 수 없습니다.");
        }
        this.status = status;
    }
}
