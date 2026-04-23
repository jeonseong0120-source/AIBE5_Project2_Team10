package com.devnear.web.domain.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long>, ProjectRepositoryCustom {

    /** 단건 조회는 페이징 문제가 없으므로 Fetch Join을 유지하여 한 번에 가져옴*/
    @Query("SELECT DISTINCT p FROM Project p " +
            "JOIN FETCH p.clientProfile cp " +
            "JOIN FETCH cp.user " +
            "LEFT JOIN FETCH p.projectSkills ps " +
            "LEFT JOIN FETCH ps.skill " +
            "WHERE p.id = :projectId")
    Optional<Project> findByIdWithClientProfile(@Param("projectId") Long projectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :projectId")
    Optional<Project> findByIdForUpdate(@Param("projectId") Long projectId);

    /** * [최적화] Page 반환 메서드에서는 컬렉션(projectSkills) 조인을 제거
     * Batch Size 설정에 의해 스킬 데이터는 IN 쿼리로 효율적으로 로딩
     */
    @Override
    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    Page<Project> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    Page<Project> findAllByClientProfile(ClientProfile clientProfile, Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    Page<Project> findAllByClientProfileAndStatus(ClientProfile clientProfile, ProjectStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    Page<Project> findAllByFreelancerProfileAndStatus(FreelancerProfile freelancerProfile, ProjectStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    Page<Project> findAllByFreelancerProfile(FreelancerProfile freelancerProfile, Pageable pageable);

    /** [최적화] 검색 쿼리 역시 컬렉션 조인을 제거하여 메모리 페이징 발생을 원천 봉쇄합니다. */
    @EntityGraph(attributePaths = {"clientProfile", "clientProfile.user"})
    @Query(value = "SELECT DISTINCT p FROM Project p " +
            "WHERE p.status = 'OPEN' " +
            "AND (p.listingKind IS NULL OR p.listingKind = :marketplace) " +
            "AND (:excludeOwnerUserId IS NULL OR p.clientProfile.user.id <> :excludeOwnerUserId) " +
            "AND (:keyword IS NULL OR p.projectName LIKE %:keyword% OR p.clientProfile.companyName LIKE %:keyword%) " +
            "AND (:location IS NULL OR p.location LIKE %:location%) " +
            "AND (:skill IS NULL OR EXISTS (SELECT 1 FROM ProjectSkill ps JOIN ps.skill s WHERE ps.project = p AND s.name LIKE %:skill%)) " +
            "AND (:online IS NULL OR p.online = :online) " +
            "AND (:offline IS NULL OR p.offline = :offline)",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Project p " +
                    "WHERE p.status = 'OPEN' " +
                    "AND (p.listingKind IS NULL OR p.listingKind = :marketplace) " +
                    "AND (:excludeOwnerUserId IS NULL OR p.clientProfile.user.id <> :excludeOwnerUserId) " +
                    "AND (:keyword IS NULL OR p.projectName LIKE %:keyword% OR p.clientProfile.companyName LIKE %:keyword%) " +
                    "AND (:location IS NULL OR p.location LIKE %:location%) " +
                    "AND (:skill IS NULL OR EXISTS (SELECT 1 FROM ProjectSkill ps JOIN ps.skill s WHERE ps.project = p AND s.name LIKE %:skill%)) " +
                    "AND (:online IS NULL OR p.online = :online) " +
                    "AND (:offline IS NULL OR p.offline = :offline)")
    Page<Project> searchProjects(@Param("keyword") String keyword,
                                 @Param("location") String location,
                                 @Param("skill") String skill,
                                 @Param("online") Boolean online,
                                 @Param("offline") Boolean offline,
                                 @Param("marketplace") ProjectListingKind marketplace,
                                 @Param("excludeOwnerUserId") Long excludeOwnerUserId,
                                 Pageable pageable);

    /** List 반환은 페이징이 아니므로 Fetch Join을 써서 네트워크 라운드 트립을 줄입니다. */
    @Query("SELECT DISTINCT p FROM Project p " +
            "JOIN FETCH p.clientProfile cp " +
            "JOIN FETCH cp.user " +
            "LEFT JOIN FETCH p.projectSkills ps " +
            "LEFT JOIN FETCH ps.skill " +
            "WHERE p.status = :status " +
            "AND (p.listingKind IS NULL OR p.listingKind = :marketplace)")
    List<Project> findOpenMarketplaceProjectsWithSkills(@Param("status") ProjectStatus status,
                                                        @Param("marketplace") ProjectListingKind marketplace);

    @Query("SELECT p.id FROM Project p JOIN p.clientProfile cp JOIN cp.user u " +
            "WHERE p.status = :status AND (p.embeddingJson IS NULL OR p.embeddingJson = '') " +
            "AND (p.listingKind IS NULL OR p.listingKind = :marketplace) " +
            "AND u.email LIKE 'bulk-demo-client%'")
    List<Long> findOpenBulkDemoProjectIdsMissingEmbedding(@Param("status") ProjectStatus status,
                                                          @Param("marketplace") ProjectListingKind marketplace);

    boolean existsByClientProfile_IdAndStatusIn(Long clientId, Collection<ProjectStatus> statuses);

    boolean existsByFreelancerProfile_IdAndStatusIn(Long freelancerId, Collection<ProjectStatus> statuses);

}