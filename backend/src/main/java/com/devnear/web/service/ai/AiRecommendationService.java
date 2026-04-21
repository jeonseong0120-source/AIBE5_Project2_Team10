package com.devnear.web.service.ai;

import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.WorkStyle;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.dto.ai.RecommendedProjectResponse;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 모집 중 클라이언트 공고를 프리랜서 프로필 기준으로 점수화합니다.
 * 스킬 태그(Jaccard), 희망 작업 방식(온·오프라인), 지역, 공고 예산(희망 시급 대비), 평점을 함께 반영합니다.
 */
@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private static final int DEFAULT_TOP_N = 5;
    private static final int MAX_TOP_N = 20;

    /** 최소 예상 근무 시간(시급 대비 예산 적합도 계산용 가정) */
    private static final int BUDGET_ASSUMED_MIN_HOURS = 40;

    private static final double W_TAG = 0.36;
    private static final double W_MODALITY = 0.18;
    private static final double W_REGION = 0.20;
    private static final double W_BUDGET = 0.26;

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<RecommendedProjectResponse> recommendTopProjectsForFreelancer(Long freelancerProfileId, Integer limit) {
        int topN = limit == null ? DEFAULT_TOP_N : Math.min(Math.max(1, limit), MAX_TOP_N);

        FreelancerProfile profile = freelancerProfileRepository.findByIdWithSkills(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. id=" + freelancerProfileId));

        Set<String> freelancerTags = extractFreelancerTags(profile);
        double ratingBoost = normalizedRating(profile);

        List<Project> candidates = projectRepository.findOpenMarketplaceProjectsWithSkills(
                ProjectStatus.OPEN, ProjectListingKind.MARKETPLACE);
        Long viewerUserId = profile.getUser().getId();

        return candidates.stream()
                .filter(p -> !p.getClientProfile().getUser().getId().equals(viewerUserId))
                .filter(p -> passesLocationStage(profile, p))
                .map(p -> new ScoredProject(p, scoreProject(profile, p, freelancerTags) + ratingBoost))
                .sorted(Comparator.comparingDouble(ScoredProject::score).reversed())
                .limit(topN)
                .map(sp -> RecommendedProjectResponse.of(sp.project(), clamp01(sp.score())))
                .collect(Collectors.toList());
    }

    private static double scoreProject(FreelancerProfile profile, Project project, Set<String> freelancerTags) {
        double tagPart = tagScore(freelancerTags, project);
        double modalityPart = modalityFitScore(profile.getWorkStyle(), project.isOnline(), project.isOffline());
        double regionPart = regionFitScore(profile.getLocation(), project.getLocation(), project.isOnline(), project.isOffline());
        double budgetPart = budgetFitScore(profile.getHourlyRate(), project.getBudget());
        return clamp01(W_TAG * tagPart + W_MODALITY * modalityPart + W_REGION * regionPart + W_BUDGET * budgetPart);
    }

    private static double tagScore(Set<String> freelancerTags, Project project) {
        if (freelancerTags == null || freelancerTags.isEmpty()) {
            return 0.35;
        }
        double j = jaccardSimilarity(freelancerTags, extractProjectTags(project));
        return clamp01(j);
    }

    /**
     * 희망 작업 방식과 공고의 온·오프라인 제공 방식이 얼마나 잘 맞는지 (0~1).
     */
    private static double modalityFitScore(WorkStyle style, boolean projectOnline, boolean projectOffline) {
        WorkStyle s = style == null ? WorkStyle.HYBRID : style;
        return switch (s) {
            case ONLINE -> projectOnline ? 1.0 : 0.0;
            case OFFLINE -> projectOffline ? 1.0 : 0.0;
            case HYBRID -> {
                if (projectOnline && projectOffline) {
                    yield 1.0;
                }
                if (projectOnline) {
                    yield 0.86;
                }
                if (projectOffline) {
                    yield 0.82;
                }
                yield 0.0;
            }
        };
    }

    /**
     * 지역 텍스트 일치·근접 여부. 온라인 전용 공고는 지역 불일치에 덜 민감하게 점수를 줍니다.
     */
    private static double regionFitScore(String freelancerLocation, String projectLocation,
                                         boolean projectOnline, boolean projectOffline) {
        if (regionMatches(freelancerLocation, projectLocation)) {
            return 1.0;
        }
        if (freelancerLocation == null || freelancerLocation.isBlank()) {
            return 0.58;
        }
        if (projectLocation == null || projectLocation.isBlank()) {
            return 0.62;
        }
        if (projectOnline && !projectOffline) {
            return 0.52;
        }
        return 0.28;
    }

    /**
     * 공고 총예산이 희망 시급×가정 근무시간 대비 충분한지 (0~1). 시급 미설정이면 중립.
     */
    private static double budgetFitScore(Integer freelancerHourly, Integer projectBudget) {
        if (freelancerHourly == null || freelancerHourly <= 0) {
            return 0.55;
        }
        if (projectBudget == null || projectBudget <= 0) {
            return 0.48;
        }
        double minBudget = freelancerHourly * (double) BUDGET_ASSUMED_MIN_HOURS;
        double ratio = projectBudget / minBudget;
        return clamp01(ratio);
    }

    private static boolean passesLocationStage(FreelancerProfile profile, Project project) {
        WorkStyle style = profile.getWorkStyle() == null ? WorkStyle.HYBRID : profile.getWorkStyle();

        boolean onlineAllowed = style == WorkStyle.ONLINE || style == WorkStyle.HYBRID;
        boolean offlineAllowed = style == WorkStyle.OFFLINE || style == WorkStyle.HYBRID;

        boolean onlineMatch = onlineAllowed && project.isOnline();
        boolean offlineMatch = offlineAllowed && project.isOffline()
                && (project.getLocation() == null || project.getLocation().isBlank()
                || regionMatches(profile.getLocation(), project.getLocation()));
        return onlineMatch || offlineMatch;
    }

    private static boolean regionMatches(String freelancerRegion, String projectRegion) {
        if (freelancerRegion == null || freelancerRegion.isBlank()) {
            return true;
        }
        if (projectRegion == null || projectRegion.isBlank()) {
            return false;
        }
        String f = freelancerRegion.replaceAll("\\s+", "").toLowerCase();
        String p = projectRegion.replaceAll("\\s+", "").toLowerCase();
        return p.contains(f) || f.contains(p);
    }

    private static Set<String> extractFreelancerTags(FreelancerProfile profile) {
        if (profile.getFreelancerSkills() == null) {
            return Set.of();
        }
        return profile.getFreelancerSkills().stream()
                .map(FreelancerSkill::getSkill)
                .filter(s -> s != null && s.getName() != null)
                .map(s -> s.getName().trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static Set<String> extractProjectTags(Project project) {
        if (project.getProjectSkills() == null) {
            return Set.of();
        }
        return project.getProjectSkills().stream()
                .map(ps -> ps.getSkill())
                .filter(s -> s != null && s.getName() != null)
                .map(s -> s.getName().trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static double jaccardSimilarity(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }
        Set<String> union = new HashSet<>(left);
        union.addAll(right);
        if (union.isEmpty()) {
            return 0.0;
        }
        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);
        return (double) intersection.size() / union.size();
    }

    private static double normalizedRating(FreelancerProfile profile) {
        if (profile.getAverageRating() == null || profile.getAverageRating() <= 0) {
            return 0.0;
        }
        return clamp01(profile.getAverageRating() / 5.0) * 0.12;
    }

    private static double clamp01(double value) {
        if (value < 0.0) return 0.0;
        if (value > 1.0) return 1.0;
        return value;
    }

    private record ScoredProject(Project project, double score) {
    }
}
