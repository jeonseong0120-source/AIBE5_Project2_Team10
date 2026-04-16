package com.devnear.web.service.freelancer;

import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FreelancerGradeService {

    private final FreelancerGradeRepository freelancerGradeRepository;
    private final PortfolioRepository portfolioRepository;

    @Transactional
    public void refreshGrade(FreelancerProfile freelancerProfile) {
        FreelancerGrade targetGrade = calculateGrade(freelancerProfile);
        freelancerProfile.updateGrade(targetGrade);
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
            activeMonths = ChronoUnit.MONTHS.between(
                    freelancerProfile.getCreatedAt().toLocalDate(),
                    LocalDate.now()
            );
        }

        if (completedProjects >= 10
                && averageRating >= 4.5
                && reviewCount >= 20
                && portfolioCount >= 3
                && activeMonths >= 3) {
            return getGradeOrThrow("TOP Talent");
        }

        if (completedProjects >= 3
                && averageRating >= 4.0
                && portfolioCount >= 1) {
            return getGradeOrThrow("인증 프리랜서");
        }

        return getGradeOrThrow("일반");
    }

    private FreelancerGrade getGradeOrThrow(String name) {
        return freelancerGradeRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 등급 데이터가 없습니다: " + name));
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}