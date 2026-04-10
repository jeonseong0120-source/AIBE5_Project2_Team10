package com.devnear.web.domain.portfolio;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "Portfolio")
public class Portfolio extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "portfolio_id")
    private Long id;

    // [연관관계] 어떤 유저가 등록한 포트폴리오인지 (1명의 유저가 여러 포트폴리오 등록 가능 -> N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String desc; // 기획안의 desc 매핑, Java 키워드 혼동 우려 시 description이 권장되나 명세서대로 desc 유지

    @Column(name = "thumbnail_url") // erd 추가해야함
    private String thumbnailUrl; // 단일 썸네일 (null 허용, 프론트에서 기본 이미지 처리 가능)

    // [연관관계] 포트폴리오 내 다중 상세 이미지들 (1:N)
    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PortfolioImage> portfolioImages = new LinkedHashSet<>();

    // [연관관계] 포트폴리오에 사용된 기술 스택들 (고아 객체 제거 옵션 켜서 스킬 수정 시 자동 삭제)
    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PortfolioSkill> portfolioSkills = new LinkedHashSet<>();

    @Builder
    public Portfolio(User user, String title, String desc, String thumbnailUrl) {
        this.user = user;
        this.title = title;
        this.desc = desc;
        this.thumbnailUrl = thumbnailUrl;
    }

    // [비즈니스 로직] 스킬 연결 (양방향 연결)
    public void addPortfolioSkill(PortfolioSkill portfolioSkill) {
        this.portfolioSkills.add(portfolioSkill);
        if (portfolioSkill.getPortfolio() != this) {
            portfolioSkill.setPortfolio(this);
        }
    }

    // [비즈니스 로직] 다중 상세 이미지 연결
    public void addPortfolioImage(PortfolioImage portfolioImage) {
        this.portfolioImages.add(portfolioImage);
        if (portfolioImage.getPortfolio() != this) {
            portfolioImage.setPortfolio(this);
        }
    }

    // [비즈니스 로직] 포트폴리오 정보 수정
    public void update(String title, String desc, String thumbnailUrl) {
        this.title = title;
        this.desc = desc;
        this.thumbnailUrl = thumbnailUrl;
    }
}
