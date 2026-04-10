package com.devnear.web.dto.portfolio;

import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.dto.skill.SkillResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class PortfolioResponse {

    private Long id;
    private String title;
    private String desc;
    private String thumbnailUrl;
    private List<String> portfolioImages;
    private List<SkillResponse> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PortfolioResponse from(Portfolio portfolio) {
        List<SkillResponse> skillResponses = portfolio.getPortfolioSkills().stream()
                .map(ps -> SkillResponse.from(ps.getSkill()))
                .collect(Collectors.toList());

        List<String> imageResponses = portfolio.getPortfolioImages().stream()
                .map(image -> image.getImageUrl())
                .collect(Collectors.toList());

        return PortfolioResponse.builder()
                .id(portfolio.getId())
                .title(portfolio.getTitle())
                .desc(portfolio.getDesc())
                .thumbnailUrl(portfolio.getThumbnailUrl())
                .portfolioImages(imageResponses)
                .skills(skillResponses)
                .createdAt(portfolio.getCreatedAt())
                .updatedAt(portfolio.getUpdatedAt())
                .build();
    }
}
