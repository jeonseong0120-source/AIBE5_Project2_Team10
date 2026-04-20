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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 프리랜서 포트폴리오·프로필 텍스트와 공개 프로젝트 공고 임베딩의 코사인 유사도로 추천 점수를 계산합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private static final int DEFAULT_TOP_N = 5;
    private static final int MAX_TOP_N = 20;

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerEmbeddingService freelancerEmbeddingService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<RecommendedProjectResponse> recommendTopProjectsForFreelancer(Long freelancerProfileId, Integer limit) {
        int topN = limit == null ? DEFAULT_TOP_N : Math.min(Math.max(1, limit), MAX_TOP_N);

        FreelancerProfile profile = freelancerProfileRepository.findByIdWithSkills(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. id=" + freelancerProfileId));

        final double[] freelancerVector = loadFreelancerVector(profile);
        if (freelancerVector.length == 0) {
            return List.of();
        }

        Set<String> freelancerTags = extractFreelancerTags(profile);
        double ratingBoost = normalizedRating(profile);

        List<Project> candidates = projectRepository.findByStatusAndEmbeddingJsonIsNotNull(
                ProjectStatus.OPEN, ProjectListingKind.MARKETPLACE);
        Long viewerUserId = profile.getUser().getId();
        List<ScoredProject> scored = new ArrayList<>();
        for (Project p : candidates) {
            if (p.getClientProfile().getUser().getId().equals(viewerUserId)) {
                continue;
            }
            if (!passesLocationStage(profile, p)) {
                continue;
            }
            if (p.getEmbeddingJson() == null || p.getEmbeddingJson().isBlank()) {
                continue;
            }
            try {
                double[] pv = objectMapper.readValue(p.getEmbeddingJson(), double[].class);
                double cosine = cosineSimilarity(freelancerVector, pv);
                if (Double.isNaN(cosine)) {
                    continue;
                }
                double vectorTagScore = clamp01(cosine);
                double exactTagScore = jaccardSimilarity(freelancerTags, extractProjectTags(p));
                // 재능 태그 유사도(벡터 + 태그 교집합) + 평점 보정
                double tagScore = clamp01(vectorTagScore * 0.7 + exactTagScore * 0.3);
                double finalScore = clamp01(tagScore + ratingBoost);
                scored.add(new ScoredProject(p, finalScore));
            } catch (Exception e) {
                log.debug("Skip project {} invalid embedding json", p.getId());
            }
        }

        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredProject::score).reversed())
                .limit(topN)
                .map(sp -> RecommendedProjectResponse.of(sp.project(), sp.score()))
                .collect(Collectors.toList());
    }

    private double[] loadFreelancerVector(FreelancerProfile profile) {
        if (profile.getEmbeddingJson() == null || profile.getEmbeddingJson().isBlank()) {
            Long freelancerProfileId = profile.getId();
            freelancerEmbeddingService.refreshEmbeddingForFreelancerId(freelancerProfileId);
            profile = freelancerProfileRepository.findByIdWithSkills(freelancerProfileId)
                    .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. id=" + freelancerProfileId));
        }
        if (profile.getEmbeddingJson() == null || profile.getEmbeddingJson().isBlank()) {
            log.debug("Empty freelancer embedding for profileId={}", profile.getId());
            return new double[0];
        }
        try {
            return objectMapper.readValue(profile.getEmbeddingJson(), double[].class);
        } catch (Exception e) {
            log.warn("Invalid freelancer embedding json profileId={}", profile.getId());
            return new double[0];
        }
    }

    private static boolean passesLocationStage(FreelancerProfile profile, Project project) {
        WorkStyle style = profile.getWorkStyle() == null ? WorkStyle.HYBRID : profile.getWorkStyle();

        boolean onlineAllowed = style == WorkStyle.ONLINE || style == WorkStyle.HYBRID;
        boolean offlineAllowed = style == WorkStyle.OFFLINE || style == WorkStyle.HYBRID;

        boolean onlineMatch = onlineAllowed && project.isOnline();
        boolean offlineMatch = offlineAllowed && project.isOffline()
                && regionMatches(profile.getLocation(), project.getLocation());
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
        // 평점은 보정 값으로 사용 (최대 +0.2)
        return clamp01(profile.getAverageRating() / 5.0) * 0.2;
    }

    private static double clamp01(double value) {
        if (value < 0.0) return 0.0;
        if (value > 1.0) return 1.0;
        return value;
    }

    private static double cosineSimilarity(double[] a, double[] b) {
        if (a.length != b.length || a.length == 0) {
            return Double.NaN;
        }
        double dot = 0;
        double na = 0;
        double nb = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) {
            return Double.NaN;
        }
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private record ScoredProject(Project project, double score) {
    }
}
