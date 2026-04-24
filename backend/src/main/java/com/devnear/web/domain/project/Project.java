package com.devnear.web.domain.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.ProjectListingKind;
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
@Table(
        name = "projects",
        indexes = {
                @Index(name = "idx_project_status_deadline", columnList = "status, deadline"),
                @Index(name = "idx_project_created_at", columnList = "created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long id;

    /**
     * 동시에 여러 역제안 수락 등으로 프로젝트 매칭/상태가 덮어쓰이는 것을 방지합니다.
     */
    @Version
    @Column(nullable = false)
    private Long version;

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

    /**
     * null은 기존 DB 호환으로 {@link ProjectListingKind#MARKETPLACE}와 동일하게 취급합니다.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "listing_kind", length = 32)
    private ProjectListingKind listingKind;

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

    /**
     * 공고 텍스트(제목·상세·스킬)에 대한 Gemini 임베딩(JSON 숫자 배열). 등록/수정 시 갱신.
     */
    @Column(name = "embedding_json", columnDefinition = "LONGTEXT")
    private String embeddingJson;

    @Column(name = "embedding_model", length = 64)
    private String embeddingModel;

    @Column(name = "embedding_dimensions")
    private Integer embeddingDimensions;

    @Builder
    public Project(ClientProfile clientProfile, String projectName, Integer budget,
                   LocalDate deadline, String detail, boolean online, boolean offline,
                   String location, Double latitude, Double longitude,
                   ProjectListingKind listingKind) {
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
        this.listingKind = listingKind != null ? listingKind : ProjectListingKind.MARKETPLACE;
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

    public void assignTextEmbedding(String json, String model, int dimensions) {
        this.embeddingJson = json;
        this.embeddingModel = model;
        this.embeddingDimensions = dimensions;
    }

    public void clearTextEmbedding() {
        this.embeddingJson = null;
        this.embeddingModel = null;
        this.embeddingDimensions = null;
    }
}
