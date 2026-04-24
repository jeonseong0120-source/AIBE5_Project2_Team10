package com.devnear.web.domain.freelancer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;

public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, Long>, FreelancerProfileRepositoryCustom {
    
    Optional<FreelancerProfile> findByUser_Id(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT fp FROM FreelancerProfile fp WHERE fp.id = :id")
    Optional<FreelancerProfile> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT DISTINCT fp FROM FreelancerProfile fp " +
           "LEFT JOIN FETCH fp.freelancerSkills fs " +
           "LEFT JOIN FETCH fs.skill " +
           "WHERE fp.user.id = :userId")
    Optional<FreelancerProfile> findByUserIdWithSkills(@Param("userId") Long userId);

    // [API] 프리랜서 상세 조회 (id로 찾기)
    @Query("SELECT DISTINCT fp FROM FreelancerProfile fp " +
           "JOIN FETCH fp.user u " +
           "LEFT JOIN FETCH fp.freelancerSkills fs " +
           "LEFT JOIN FETCH fs.skill " +
           "WHERE fp.id = :id")
    Optional<FreelancerProfile> findByIdWithSkills(@Param("id") Long id);

    // [API] 목록 탐색 필터링용 (skill, region, workStyle)
    // 활동중(isActive=true)인 사용자만 노출
    @Query("SELECT DISTINCT fp FROM FreelancerProfile fp " +
           "LEFT JOIN FETCH fp.freelancerSkills fs " +
           "LEFT JOIN FETCH fs.skill " +
           "WHERE fp.isActive = true " +
           "AND (:excludeUserId IS NULL OR fp.user.id <> :excludeUserId) " +
           "AND (:region IS NULL OR fp.location LIKE %:region%) " +
           "AND (:workStyle IS NULL OR (fp.workStyle = :workStyle OR fp.workStyle = com.devnear.web.domain.enums.WorkStyle.HYBRID)) " +
           "AND (:keyword IS NULL OR (fp.introduction LIKE %:keyword% OR fp.user.nickname LIKE %:keyword%)) " +
           "AND (:minHourlyRate IS NULL OR fp.hourlyRate >= :minHourlyRate) " +
           "AND (:maxHourlyRate IS NULL OR fp.hourlyRate <= :maxHourlyRate) " +
           "AND (:skills IS NULL OR fs.skill.name IN :skills)")
    List<FreelancerProfile> searchFreelancers(
            @Param("skills") List<String> skills,
            @Param("region") String region,
            @Param("workStyle") com.devnear.web.domain.enums.WorkStyle workStyle,
            @Param("keyword") String keyword,
            @Param("minHourlyRate") Integer minHourlyRate,
            @Param("maxHourlyRate") Integer maxHourlyRate,
            @Param("excludeUserId") Long excludeUserId);
}
