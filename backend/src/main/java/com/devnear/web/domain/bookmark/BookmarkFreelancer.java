package com.devnear.web.domain.bookmark;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bookmarks_freelancer",
        uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "freelancer_profile_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookmarkFreelancer extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bookmark_id")
    private Long bookmarkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientProfile clientProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_profile_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    @Builder
    public BookmarkFreelancer(ClientProfile clientProfile, FreelancerProfile freelancerProfile) {
        this.clientProfile     = clientProfile;
        this.freelancerProfile = freelancerProfile;
    }
}