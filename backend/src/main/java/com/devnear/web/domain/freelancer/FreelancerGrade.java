package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "FreelancerGrade")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FreelancerGrade extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "freelancer_grade_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Builder
    public FreelancerGrade(String name) {
        this.name = name;
    }
}
