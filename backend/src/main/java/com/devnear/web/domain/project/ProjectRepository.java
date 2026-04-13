package com.devnear.web.domain.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // 수정/삭제 시 권한 확인 및 상세 조회용 (스킬 정보 포함)
    @Query("SELECT DISTINCT p FROM Project p " +
           "JOIN FETCH p.clientProfile cp " +
           "JOIN FETCH cp.user " +
           "LEFT JOIN FETCH p.projectSkills ps " +
           "LEFT JOIN FETCH ps.skill " +
           "WHERE p.id = :projectId")
    Optional<Project> findByIdWithClientProfile(@Param("projectId") Long projectId);

    @Override
    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user", "projectSkills", "projectSkills.skill"})
    Page<Project> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user", "projectSkills", "projectSkills.skill"})
    Page<Project> findAllByClientProfile(ClientProfile clientProfile, Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user", "projectSkills", "projectSkills.skill"})
    Page<Project> findAllByClientProfileAndStatus(ClientProfile clientProfile, ProjectStatus status, Pageable pageable);
}
