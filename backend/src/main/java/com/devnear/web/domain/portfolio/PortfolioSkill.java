package com.devnear.web.domain.portfolio;

import com.devnear.web.domain.skill.Skill;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
    name = "PortfolioSkill",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"portfolio_id", "skill_id"}) // 동일 스킬 중복 방어
    }
)
public class PortfolioSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "portfolio_skill_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Builder
    public PortfolioSkill(Portfolio portfolio, Skill skill) {
        this.portfolio = portfolio;
        this.skill = skill;
    }

    public void setPortfolio(Portfolio portfolio) {
        this.portfolio = portfolio;
    }
}
