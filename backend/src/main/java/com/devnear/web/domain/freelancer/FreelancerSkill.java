package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.skill.Skill;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "FreelancerSkill")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 프리랜서와 스킬을 연결하는 다리(Bridge) 엔티티
public class FreelancerSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "freelancer_skill_id")
    private Long id;

    // [연관관계] 스킬을 보유한 프리랜서
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_profile_id", nullable = false)
    private FreelancerProfile freelancerProfile;

    // [연관관계] 실제 스킬 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Builder
    public FreelancerSkill(FreelancerProfile freelancerProfile, Skill skill) {
        this.freelancerProfile = freelancerProfile;
        this.skill = skill;
    }

    public void setFreelancerProfile(FreelancerProfile profile) {
        this.freelancerProfile = profile;
    }
}
