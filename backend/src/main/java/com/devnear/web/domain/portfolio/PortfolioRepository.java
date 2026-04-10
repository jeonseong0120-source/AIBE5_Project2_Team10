package com.devnear.web.domain.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    // 특정 유저의 포트폴리오 목록 조회 시 스킬 정보까지 N+1 방지된 상태로 한 번에 가져오기
    @Query("SELECT DISTINCT p FROM Portfolio p " +
           "LEFT JOIN FETCH p.portfolioSkills ps " +
           "LEFT JOIN FETCH ps.skill " +
           "WHERE p.user.id = :userId")
    List<Portfolio> findByUserIdWithSkills(@Param("userId") Long userId);
}
