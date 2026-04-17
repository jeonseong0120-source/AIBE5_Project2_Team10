package com.devnear.web.domain.bookmark;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.project.Project;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bookmarks_project",
        uniqueConstraints = @UniqueConstraint(columnNames = {"freelancer_profile_id", "project_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookmarkProject extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bookmark_id")
    private Long bookmarkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_profile_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Builder
    public BookmarkProject(FreelancerProfile freelancerProfile, Project project) {
        this.freelancerProfile = freelancerProfile;
        this.project           = project;
    }
}
