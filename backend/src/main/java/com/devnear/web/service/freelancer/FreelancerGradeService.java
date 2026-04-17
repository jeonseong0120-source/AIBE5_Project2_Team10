package com.devnear.web.service.freelancer;

import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FreelancerGradeService {

    private static final Logger log = LoggerFactory.getLogger(FreelancerGradeService.class);

    private final FreelancerGradeRepository freelancerGradeRepository;
    private final PortfolioRepository portfolioRepository;

    /**
     * 포트폴리오 등록/수정/삭제 후 등급을 재계산합니다.
     * REQUIRES_NEW: 호출자(PortfolioService)의 트랜잭션과 완전히 분리되며,
     * 이 메서드 내부에서 예외가 발생해도 포트폴리오 저장 트랜잭션에 영향을 주지 않습니다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refreshGrade(FreelancerProfile freelancerProfile) {
        try {
            FreelancerGrade targetGrade = calculateGrade(freelancerProfile);
            if (targetGrade != null) {
                freelancerProfile.updateGrade(targetGrade);
            } else {
                log.warn("[FreelancerGradeService] 적용할 등급 데이터를 찾지 못했습니다. 현재 등급 유지.");
            }
        } catch (Exception e) {
            log.warn("[FreelancerGradeService] 등급 재계산 중 오류 발생 (무시됨): {}", e.getMessage());
        }
    }

    public FreelancerGrade calculateGrade(FreelancerProfile freelancerProfile) {
        if (freelancerProfile == null || freelancerProfile.getUser() == null || freelancerProfile.getUser().getId() == null) {
            throw new IllegalArgumentException("freelancerProfile.user.id is required");
        }
        int completedProjects = safeInt(freelancerProfile.getCompletedProjects());
        double averageRating = safeDouble(freelancerProfile.getAverageRating());
        int reviewCount = safeInt(freelancerProfile.getReviewCount());
        long portfolioCount = portfolioRepository.countByUser_Id(freelancerProfile.getUser().getId());

        long activeMonths = 0;
        if (freelancerProfile.getCreatedAt() != null) {
            activeMonths = Math.max(0, ChronoUnit.MONTHS.between(
                    freelancerProfile.getCreatedAt().toLocalDate(),
                    LocalDate.now()
            ));
        }

        if (completedProjects >= 10
                && averageRating >= 4.5
                && reviewCount >= 20
                && portfolioCount >= 3
                && activeMonths >= 3) {
            return findGrade("TOP Talent");
        }

        if (completedProjects >= 3
                && averageRating >= 4.0
                && portfolioCount >= 1) {
            return findGrade("인증 프리랜서");
        }

        return findGrade("일반");
    }

    private FreelancerGrade findGrade(String name) {
        return freelancerGradeRepository.findByName(name)
                .orElseGet(() -> {
                    log.warn("[FreelancerGradeService] '{}' 등급 데이터가 DB에 없습니다. null 반환.", name);
                    return null;
                });
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}