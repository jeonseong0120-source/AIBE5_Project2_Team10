package com.devnear.web.domain.payment;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import com.devnear.web.domain.enums.PaymentStatus;

import java.util.Collection;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(String orderId);

    @Query("SELECT p FROM Payment p WHERE p.project.id = :projectId")
    Optional<Payment> findByProjectId(@Param("projectId") Long projectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.project.id = :projectId")
    Optional<Payment> findByProjectIdForUpdate(@Param("projectId") Long projectId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Payment p WHERE p.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
    @Query("SELECT p FROM Payment p WHERE p.orderId = :orderId")
    Optional<Payment> findByOrderIdForUpdate(@Param("orderId") String orderId);

    /**
     * 배정된 프리랜서 기준: {@code terminalStatuses} 이외의 결제가 하나라도 있으면 true.
     */
    boolean existsByProject_FreelancerProfile_IdAndStatusNotIn(Long freelancerProfileId,
                                                             Collection<PaymentStatus> terminalStatuses);
}

