package com.devnear.web.domain.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.dto.project.ProjectRequest;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientProfile clientProfile;

    // 추가: 실제 수행 프리랜서
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id")
    private FreelancerProfile freelancerProfile;

    @Column(name = "project_name", nullable = false, length = 100)
    private String projectName;

    @Column(nullable = false)
    private Integer budget;

    @Column(name = "deadline", nullable = false)
    private LocalDate deadline;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status;

    @Column(nullable = false)
    private boolean online;

    @Column(nullable = false)
    private boolean offline;

    @Column(length = 500)
    private String location;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @BatchSize(size = 100)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectSkill> projectSkills = new ArrayList<>();

    @Builder
    public Project(ClientProfile clientProfile, String projectName, Integer budget,
                   LocalDate deadline, String detail, boolean online, boolean offline,
                   String location, Double latitude, Double longitude) {
        this.clientProfile = clientProfile;
        this.projectName = projectName;
        this.budget = budget;
        this.deadline = deadline;
        this.detail = detail;
        this.online = online;
        this.offline = offline;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = ProjectStatus.OPEN;
        // [수정] Builder 생성 시 NullPointerException을 방지하기 위한 명시적 컬렉션 초기화
        this.projectSkills = new ArrayList<>();
    }

    public void update(ProjectRequest request) {
        this.projectName = request.getProjectName();
        this.budget = request.getBudget();
        this.deadline = request.getDeadline();
        this.detail = request.getDetail();
        this.online = request.isOnline();
        this.offline = request.isOffline();
        this.location = request.getLocation();
        this.latitude = request.getLatitude();
        this.longitude = request.getLongitude();
    }

    // 추가: 프로젝트에 프리랜서 매칭
    public void assignFreelancer(FreelancerProfile freelancerProfile) {
        this.freelancerProfile = freelancerProfile;
    }

    public void close() {
        if (this.status != ProjectStatus.OPEN) {
            throw new IllegalStateException("모집 중인 프로젝트만 마감할 수 있습니다.");
        }
        this.status = ProjectStatus.CLOSED;
    }

    public void start() {
        if (this.status != ProjectStatus.OPEN) {
            throw new IllegalStateException("모집 중인 프로젝트만 시작할 수 있습니다.");
        }
        this.status = ProjectStatus.IN_PROGRESS;
    }

    public void complete() {
        if (this.status != ProjectStatus.IN_PROGRESS) {
            throw new IllegalStateException("진행 중인 프로젝트만 완료할 수 있습니다.");
        }
        this.status = ProjectStatus.COMPLETED;
    }

    public void updateSkills(List<ProjectSkill> newProjectSkills) {
        if (this.projectSkills == null) {
            this.projectSkills = new ArrayList<>();
        }
        this.projectSkills.clear();
        if (newProjectSkills != null) {
            for (ProjectSkill ps : newProjectSkills) {
                this.projectSkills.add(ps);
                // 양방향 연관관계 편의 로직 (생략 가능하지만 안전을 위해)
            }
        }
    }
}
