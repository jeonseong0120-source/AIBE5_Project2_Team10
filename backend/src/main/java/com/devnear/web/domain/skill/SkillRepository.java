package com.devnear.web.domain.skill;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByName(String name);

    List<Skill> findByNameIn(List<String> names);

    @Modifying(flushAutomatically = true, clearAutomatically = false)
    @Query(value = """
            INSERT INTO `Skills` (`name`, `is_default`, `category`)
            VALUES (:name, false, NULL)
            ON DUPLICATE KEY UPDATE `name` = `name`
            """, nativeQuery = true)
    int upsertByName(@Param("name") String name);

    List<Skill> findByCategory(String category);

    List<Skill> findByIsDefaultTrue();

    List<Skill> findByNameContainingIgnoreCase(String keyword);

    boolean existsByName(String name);
}
