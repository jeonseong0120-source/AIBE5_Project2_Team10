package com.devnear.web.domain.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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

    // (CLI-05) 작업 영역
}
