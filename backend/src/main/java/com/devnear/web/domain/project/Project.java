package com.devnear.web.domain.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.dto.project.ProjectRequest;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(name = "project_name", nullable = false, length = 100)
    private String projectName;

    @Column(nullable = false)
    private Integer budget;

    @Column(name = "Deadline", nullable = false)
    private LocalDate deadline;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status;

    @Column(nullable = false)
    private boolean online; // 원격 근무 여부 (기본값 0/false)

    @Column(nullable = false)
    private boolean offline; // 상주 근무 여부 (기본값 0/false)

    @Column(length = 500)
    private String location;

    @Column
    private Double latitude; // 위도

    @Column
    private Double longitude; // 경도

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
        this.status = ProjectStatus.OPEN; // 기본값 모집중(OPEN)
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

    public void close() {
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
        this.projectSkills.clear();
        this.projectSkills.addAll(newProjectSkills);
    }
}