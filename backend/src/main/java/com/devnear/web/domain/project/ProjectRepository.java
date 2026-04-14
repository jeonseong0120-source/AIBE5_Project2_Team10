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

    // [수정] 프론트엔드 리뷰 반영: activeTab(온라인/오프라인) 동적 필터링 파라미터 추가
    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user", "projectSkills", "projectSkills.skill"})
    @Query("SELECT p FROM Project p " +
           "WHERE (:keyword IS NULL OR p.projectName LIKE %:keyword% OR p.clientProfile.companyName LIKE %:keyword%) " +
           "AND (:location IS NULL OR p.location LIKE %:location%) " +
           "AND (:skill IS NULL OR EXISTS (SELECT 1 FROM ProjectSkill ps JOIN ps.skill s WHERE ps.project = p AND s.name LIKE %:skill%)) " +
           "AND (:online IS NULL OR p.online = :online) " +
           "AND (:offline IS NULL OR p.offline = :offline)")
    Page<Project> searchProjects(@Param("keyword") String keyword, 
                                 @Param("location") String location, 
                                 @Param("skill") String skill, 
                                 @Param("online") Boolean online,
                                 @Param("offline") Boolean offline,
                                 Pageable pageable);
}
