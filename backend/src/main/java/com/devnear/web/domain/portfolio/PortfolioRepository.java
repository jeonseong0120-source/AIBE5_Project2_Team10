package com.devnear.web.domain.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    interface PortfolioPreviewRow {
        Long getUserId();
        Long getPortfolioId();
        String getPreviewUrl();
    }

    /**
     * 사용자별 포트폴리오 목록에서 "포트폴리오당 대표 URL 1개"만 가볍게 조회한다.
     * - 썸네일이 있으면 썸네일 사용
     * - 없으면 sortOrder가 가장 낮은 상세 이미지 1장 사용
     * - 엔티티/컬렉션 fetch join 없이 스칼라 프로젝션으로 반환
     */
    @Query("SELECT p.user.id AS userId, " +
            "p.id AS portfolioId, " +
            "COALESCE(p.thumbnailUrl, pi.imageUrl) AS previewUrl " +
            "FROM Portfolio p " +
            "LEFT JOIN p.portfolioImages pi WITH pi.sortOrder = (" +
            "  SELECT MIN(pi2.sortOrder) FROM PortfolioImage pi2 WHERE pi2.portfolio = p" +
            ") " +
            "WHERE p.user.id IN :userIds " +
            "ORDER BY p.user.id ASC, p.id DESC")
    List<PortfolioPreviewRow> findPreviewRowsByUserIds(@Param("userIds") Collection<Long> userIds);

    // 특정 유저의 포트폴리오 목록 조회 시 스킬 정보까지 N+1 방지된 상태로 한 번에 가져오기
    @Query("SELECT DISTINCT p FROM Portfolio p " +
            "LEFT JOIN FETCH p.portfolioSkills ps " +
            "LEFT JOIN FETCH ps.skill " +
            "LEFT JOIN FETCH p.portfolioImages " +
            "WHERE p.user.id = :userId")
    List<Portfolio> findByUserIdWithSkills(@Param("userId") Long userId);

    // 특정 유저가 등록한 포트폴리오 개수 조회(등급산정용)
    long countByUser_Id(Long userId);
}
