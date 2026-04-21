package com.devnear.web.domain.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectApplicationRepository extends JpaRepository<ProjectApplication, Long> {

    // 1. 중복 지원 검증용 쿼리
    boolean existsByProjectIdAndFreelancerProfileId(Long projectId, Long freelancerId);

    // 2. [FRE-05] 프리랜서 본인이 지원한 프로젝트 목록 (프로젝트 정보 & 클라이언트 정보 Fetch Join)
    @Query("SELECT a FROM ProjectApplication a " +
            "JOIN FETCH a.project p " +
            "JOIN FETCH p.clientProfile " +
            "WHERE a.freelancerProfile.id = :freelancerId " +
            "ORDER BY a.createdAt DESC")
    List<ProjectApplication> findByFreelancerProfileIdWithProject(@Param("freelancerId") Long freelancerId);

    // 3. [CLI] 프로젝트 지원자 조회 (프리랜서/스킬 포함, 매칭률 내림차순)
    @Query("SELECT DISTINCT a FROM ProjectApplication a " +
            "JOIN FETCH a.freelancerProfile fp " +
            "JOIN FETCH fp.user " +
            "LEFT JOIN FETCH fp.freelancerSkills fs " +
            "LEFT JOIN FETCH fs.skill " +
            "WHERE a.project.id = :projectId " +
            "ORDER BY a.matchingRate DESC, a.createdAt DESC")
    List<ProjectApplication> findByProjectIdWithFreelancerSorted(@Param("projectId") Long projectId);

    // 4. [CLI] 상태 변경용 조회 (프로젝트/클라이언트 소유권 검증 포함)
    @Query("SELECT a FROM ProjectApplication a " +
            "JOIN FETCH a.project p " +
            "JOIN FETCH p.clientProfile cp " +
            "JOIN FETCH cp.user " +
            "WHERE a.id = :applicationId")
    Optional<ProjectApplication> findByIdWithProjectAndClient(@Param("applicationId") Long applicationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ProjectApplication a WHERE a.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
