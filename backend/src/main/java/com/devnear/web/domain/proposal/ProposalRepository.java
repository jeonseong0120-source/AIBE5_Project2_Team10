package com.devnear.web.domain.proposal;

import com.devnear.web.domain.enums.ProposalStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    // 중복 제안 여부 확인
    boolean existsByProjectIdAndFreelancerProfileId(Long projectId, Long freelancerProfileId);

    // [CLI] 지원자 목록에 병합 — ApplicantResponse 가 프리랜서 스킬을 읽음
    @Query("SELECT DISTINCT p FROM Proposal p " +
           "JOIN FETCH p.freelancerProfile fp " +
           "JOIN FETCH fp.user " +
           "LEFT JOIN FETCH fp.freelancerSkills fs " +
           "LEFT JOIN FETCH fs.skill " +
           "WHERE p.project.id = :projectId")
    List<Proposal> findAllByProjectId(@Param("projectId") Long projectId);

    // 클라이언트가 보낸 제안 목록 (최신순)
    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.project " +
           "JOIN FETCH p.freelancerProfile fp " +
           "JOIN FETCH fp.user " +
           "WHERE p.clientProfile.id = :clientId " +
           "ORDER BY p.createdAt DESC")
    List<Proposal> findSentProposalsByClientId(@Param("clientId") Long clientId);

    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.project " +
           "JOIN FETCH p.clientProfile cp " +
           "JOIN FETCH cp.user " +
           "WHERE p.freelancerProfile.id = :freelancerId " +
           "ORDER BY p.createdAt DESC")
    List<Proposal> findReceivedProposalsByFreelancerId(@Param("freelancerId") Long freelancerId);

    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.project pr " +
           "JOIN FETCH p.clientProfile cp " +
           "JOIN FETCH cp.user " +
           "WHERE p.freelancerProfile.id = :freelancerId " +
           "AND p.status = com.devnear.web.domain.enums.ProposalStatus.ACCEPTED " +
           "AND (pr.status = com.devnear.web.domain.enums.ProjectStatus.IN_PROGRESS " +
           "OR pr.status = com.devnear.web.domain.enums.ProjectStatus.COMPLETED)")
    List<Proposal> findAcceptedReceivedProposalsByFreelancerId(@Param("freelancerId") Long freelancerId);

    // 단건 조회 (상태 변경용) - 동시 수락/거절 방지를 위해 비관적 쓰기 락 적용
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.freelancerProfile " +
           "JOIN FETCH p.project " +
           "WHERE p.id = :proposalId")
    Optional<Proposal> findByIdWithFreelancer(@Param("proposalId") Long proposalId);

    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.project pr " +
           "JOIN FETCH p.clientProfile cp " +
           "JOIN FETCH cp.user " +
           "JOIN FETCH p.freelancerProfile fp " +
           "JOIN FETCH fp.user " +
           "WHERE p.id = :proposalId")
    Optional<Proposal> findByIdForInquiry(@Param("proposalId") Long proposalId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Proposal p WHERE p.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);

    boolean existsByClientProfile_IdAndStatus(Long clientProfileId, ProposalStatus status);

    boolean existsByFreelancerProfile_IdAndStatus(Long freelancerProfileId, ProposalStatus status);

    boolean existsByProject_IdAndStatus(Long projectId, ProposalStatus status);
}
