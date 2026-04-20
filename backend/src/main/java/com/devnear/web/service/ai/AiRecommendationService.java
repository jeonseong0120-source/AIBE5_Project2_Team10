package com.devnear.web.service.ai;

import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.portfolio.PortfolioSkill;
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
import java.util.List;
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
    private final PortfolioRepository portfolioRepository;
    private final ProjectRepository projectRepository;
    private final GeminiEmbeddingClient geminiEmbeddingClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<RecommendedProjectResponse> recommendTopProjectsForFreelancer(Long freelancerProfileId, Integer limit) {
        int topN = limit == null ? DEFAULT_TOP_N : Math.min(Math.max(1, limit), MAX_TOP_N);

        FreelancerProfile profile = freelancerProfileRepository.findByIdWithSkills(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. id=" + freelancerProfileId));

        String corpus = buildFreelancerCorpus(profile);
        if (corpus.isBlank()) {
            log.debug("Empty freelancer corpus for profileId={}", freelancerProfileId);
            return List.of();
        }

        final double[] freelancerVector;
        try {
            freelancerVector = geminiEmbeddingClient.embedText(corpus);
        } catch (IllegalStateException e) {
            log.warn("Recommendation skipped (Gemini): {}", e.getMessage());
            return List.of();
        }

        List<Project> candidates = projectRepository.findByStatusAndEmbeddingJsonIsNotNull(
                ProjectStatus.OPEN, ProjectListingKind.MARKETPLACE);
        Long viewerUserId = profile.getUser().getId();
        List<ScoredProject> scored = new ArrayList<>();
        for (Project p : candidates) {
            if (p.getClientProfile().getUser().getId().equals(viewerUserId)) {
                continue;
            }
            if (p.getEmbeddingJson() == null || p.getEmbeddingJson().isBlank()) {
                continue;
            }
            try {
                double[] pv = objectMapper.readValue(p.getEmbeddingJson(), double[].class);
                double sim = cosineSimilarity(freelancerVector, pv);
                if (!Double.isNaN(sim)) {
                    scored.add(new ScoredProject(p, sim));
                }
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

    private String buildFreelancerCorpus(FreelancerProfile profile) {
        StringBuilder sb = new StringBuilder();
        if (profile.getIntroduction() != null && !profile.getIntroduction().isBlank()) {
            sb.append("소개: ").append(profile.getIntroduction().trim()).append('\n');
        }
        if (profile.getFreelancerSkills() != null) {
            String skills = profile.getFreelancerSkills().stream()
                    .map(FreelancerSkill::getSkill)
                    .filter(s -> s != null && s.getName() != null)
                    .map(s -> s.getName().trim())
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.joining(", "));
            if (!skills.isEmpty()) {
                sb.append("보유 스킬: ").append(skills).append('\n');
            }
        }

        Long userId = profile.getUser().getId();
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithSkills(userId);
        for (Portfolio pf : portfolios) {
            sb.append("포트폴리오 제목: ").append(nullToEmpty(pf.getTitle())).append('\n');
            sb.append("포트폴리오 설명: ").append(nullToEmpty(pf.getDesc())).append('\n');
            if (pf.getPortfolioSkills() != null) {
                String ps = pf.getPortfolioSkills().stream()
                        .map(PortfolioSkill::getSkill)
                        .filter(s -> s != null && s.getName() != null)
                        .map(s -> s.getName().trim())
                        .filter(s -> !s.isEmpty())
                        .distinct()
                        .collect(Collectors.joining(", "));
                if (!ps.isEmpty()) {
                    sb.append("포트폴리오 스킬: ").append(ps).append('\n');
                }
            }
        }
        return sb.toString().trim();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
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
