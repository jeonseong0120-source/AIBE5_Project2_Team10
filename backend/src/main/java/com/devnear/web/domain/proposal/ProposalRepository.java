package com.devnear.web.domain.proposal;

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

    // 특정 프로젝트에 보낸 모든 제안 목록 (지원자 목록 통합용)
    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.freelancerProfile fp " +
           "JOIN FETCH fp.user " +
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

    // 프리랜서가 받은 제안 목록 (최신순)
    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.project " +
           "JOIN FETCH p.clientProfile cp " +
           "JOIN FETCH cp.user " +
           "WHERE p.freelancerProfile.id = :freelancerId " +
           "ORDER BY p.createdAt DESC")
    List<Proposal> findReceivedProposalsByFreelancerId(@Param("freelancerId") Long freelancerId);

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
}
