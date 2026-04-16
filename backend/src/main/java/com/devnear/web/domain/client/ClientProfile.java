package com.devnear.web.domain.client;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.ClientGrade;
import com.devnear.web.domain.enums.VerificationStatus;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.client.ClientProfileRequest;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "client_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClientProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "client_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // @NotBlank 대신 nullable = false, @Size 대신 length 사용
    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "representative_name", length = 50)
    private String representativeName;

    @Column(nullable = false, unique = true, length = 20)
    private String bn;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(name = "homepage_url", length = 255)
    private String homepageUrl;

    @Column(name = "phone_num", length = 20)
    private String phoneNum;

    @Enumerated(EnumType.STRING)
    @Column(name = "grade", nullable = false, length = 20)
    private ClientGrade grade;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "total_projects")
    private Integer totalProjects;

    // 로고 업데이트가 필요할 때 주석을 해제하세요.
    // @Column(name = "logo_url")
    // private String logoUrl;

    // public void updateLogo(String logoUrl) {
    //     this.logoUrl = logoUrl;
    // }

    @Builder
    public ClientProfile(User user, String companyName, String representativeName, String bn,
                         String introduction, String homepageUrl, String phoneNum) {
        this.user = user;
        this.companyName = companyName;
        this.representativeName = representativeName;
        this.bn = bn;
        this.introduction = introduction;
        this.homepageUrl = homepageUrl;
        this.phoneNum = phoneNum;
        this.grade = ClientGrade.NORMAL;
        this.verificationStatus = VerificationStatus.PENDING;
        this.rating = BigDecimal.ZERO;
        this.totalProjects = 0;
    }

    public void update(ClientProfileRequest request) {
        this.companyName = request.getCompanyName();
        this.bn = request.getBn();
        this.representativeName = request.getRepresentativeName();
        this.introduction = request.getIntroduction();
        this.homepageUrl = request.getHomepageUrl();
        this.phoneNum = request.getPhoneNum();
    }

    public void updateRating(BigDecimal rating) {
        this.rating = rating;
    }
}

