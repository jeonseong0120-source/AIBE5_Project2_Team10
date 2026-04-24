package com.devnear.web.domain.project;

import com.devnear.web.domain.skill.Skill;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_skills",
        uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "skill_id"}),
        indexes = @Index(name = "idx_project_skill_skill_id", columnList = "skill_id"))  // 추가
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_skill_id")
    private Long projectSkillId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Builder
    public ProjectSkill(Project project, Skill skill) {
        this.project = project;
        this.skill   = skill;
    }
}