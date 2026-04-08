package com.devnear.web.domain.skill;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Skills")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "skill_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(length = 50)
    private String category;

    @Builder
    public Skill(String name, Boolean isDefault, String category) {
        this.name = name;
        this.isDefault = (isDefault != null) ? isDefault : false;
        this.category = category;
    }
}
