package com.devnear.web.domain.skill;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByName(String name);

    List<Skill> findByCategory(String category);

    List<Skill> findByIsDefaultTrue();

    List<Skill> findByNameContainingIgnoreCase(String keyword);

    boolean existsByName(String name);
}
