package com.devnear.web.domain.project;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.ProjectProposalStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_proposals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectProposal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_proposal_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_profile_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectProposalStatus status;

    @Builder
    public ProjectProposal(Project project, FreelancerProfile freelancerProfile, String message) {
        this.project = project;
        this.freelancerProfile = freelancerProfile;
        this.message = message;
        this.status = ProjectProposalStatus.PENDING;
    }

    public void cancel() {
        if (this.status != ProjectProposalStatus.PENDING) {
            throw new IllegalStateException("대기 중인 제안만 취소할 수 있습니다.");
        }
        this.status = ProjectProposalStatus.CANCELLED;
    }
}
