package com.devnear.web.service.ai;

import com.devnear.global.config.GeminiEmbeddingProperties;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.portfolio.PortfolioSkill;
import com.devnear.web.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 프리랜서 소개/스킬/포트폴리오 텍스트를 임베딩해 FreelancerProfile에 저장합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FreelancerEmbeddingService {

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final PortfolioRepository portfolioRepository;
    private final GeminiEmbeddingClient geminiEmbeddingClient;
    private final GeminiEmbeddingProperties geminiEmbeddingProperties;
    private final ObjectMapper objectMapper;

    @Transactional
    public void refreshEmbeddingForFreelancerId(Long freelancerProfileId) {
        FreelancerProfile profile = freelancerProfileRepository.findByIdWithSkills(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다. id=" + freelancerProfileId));

        String source = buildFreelancerEmbeddingText(profile, portfolioRepository.findByUserIdWithSkills(profile.getUser().getId()));
        if (source.isBlank()) {
            profile.clearTextEmbedding();
            return;
        }

        try {
            double[] vector = geminiEmbeddingClient.embedText(source);
            String json = objectMapper.writeValueAsString(vector);
            String model = geminiEmbeddingProperties.getEmbeddingModel();
            profile.assignTextEmbedding(json, model, vector.length);
        } catch (IllegalStateException e) {
            log.warn("Skip freelancer embedding (Gemini unavailable): freelancerProfileId={} reason={}",
                    freelancerProfileId, e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to persist freelancer embedding for freelancerProfileId={}", freelancerProfileId, e);
        }
    }

    public static String buildFreelancerEmbeddingText(FreelancerProfile profile, List<Portfolio> portfolios) {
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
}

