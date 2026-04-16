package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.WorkStyle;
import com.devnear.web.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "FreelancerProfile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FreelancerProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "freelancer_profile_id")
    private Long id;

    // [연관관계] 사용자 정보 (1:1 단방향 매핑)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "profile_image_url")
    private String profileImageUrl; // 프리랜서 전용 프로필 이미지

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(length = 200)
    private String location; // 활동 지역 (주소 텍스트)

    private Double latitude; // 위도 //erd 추가 필요
    private Double longitude; // 경도 //erd 추가 필요

    @Column(name = "hourly_rate") // erd 추가 필요
    private Integer hourlyRate; // 희망 시급

    @Enumerated(EnumType.STRING)
    @Column(name = "work_style", length = 20) // erd 추가 필요
    private WorkStyle workStyle = WorkStyle.HYBRID; // 희망 작업 방식 (기본값: 하이브리드)

    @Column(name = "average_rating", nullable = false)
    private Double averageRating = 0.0;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "completed_projects", nullable = false)
    private Integer completedProjects = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_grade_id")
    private FreelancerGrade grade;

    // [연관관계] 보유 스킬 목록 (1:N 양방향, 고아 객체 자동 제거)
    @OneToMany(mappedBy = "freelancerProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FreelancerSkill> freelancerSkills = new ArrayList<>();

    @Builder
    public FreelancerProfile(User user, String profileImageUrl, String introduction, String location, Double latitude,
            Double longitude, Integer hourlyRate, WorkStyle workStyle, Boolean isActive, FreelancerGrade grade) {
        this.user = user;
        this.profileImageUrl = profileImageUrl;
        this.introduction = introduction;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.hourlyRate = hourlyRate;
        this.workStyle = (workStyle != null) ? workStyle : WorkStyle.HYBRID;
        this.isActive = (isActive != null) ? isActive : true;
        this.grade = grade;
        this.averageRating = 0.0;
        this.reviewCount = 0;
        this.completedProjects = 0;
        
        // [추가] 500 NPE 에러 방어: Builder로 생성 시 컬렉션이 null이 되지 않도록 빈 리스트로 명시적 초기화
        this.freelancerSkills = new ArrayList<>();
    }
    // 완료 프로젝트 수 갱신
    public void updateCompletedProjects(Integer completedProjects) {
        this.completedProjects = completedProjects;
    }

    // 완료 프로젝트 수 1 증가
    public void increaseCompletedProjects() {
        if (this.completedProjects == null) {
            this.completedProjects = 0;
        }
        this.completedProjects++;
    }

    // [비즈니스 로직] 기본 프로필 데이터 일괄 수정
    public void updateProfile(String profileImageUrl, String introduction, String location, Double latitude,
            Double longitude, Integer hourlyRate, WorkStyle workStyle, Boolean isActive) {
        this.profileImageUrl = profileImageUrl;
        this.introduction = introduction;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.hourlyRate = hourlyRate;
        if (workStyle != null) {
            this.workStyle = workStyle;
        }
        if (isActive != null) {
            this.isActive = isActive;
        }
    }

    public void updateGrade(FreelancerGrade grade) {
        this.grade = grade;
    }

    // [비즈니스 로직] 보유 스킬 목록 갱신
    public void updateSkills(List<FreelancerSkill> rawSkills) {
        // [추가] 500 NPE 에러 2차 방어: 컬렉션이 혹시라도 null일 경우를 대비
        if (this.freelancerSkills == null) {
            this.freelancerSkills = new ArrayList<>();
        }
        
        this.freelancerSkills.clear(); // 기존 스킬 데이터베이스에서 자동 비우기
        if (rawSkills != null) {
            for (FreelancerSkill skill : rawSkills) {
                this.freelancerSkills.add(skill);
                // 양방향 연관관계 동기화
                if (skill.getFreelancerProfile() != this) {
                    skill.setFreelancerProfile(this);
                }
            }
        }
    }

    // 리뷰 평균 점수를 갱신하는 메서드
    public void updateAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }
    // 리뷰 개수를 갱신하는 메서드
    public void updateReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }
}
