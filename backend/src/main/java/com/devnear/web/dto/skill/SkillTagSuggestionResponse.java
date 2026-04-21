package com.devnear.web.dto.skill;

import com.devnear.web.domain.skill.Skill;

public record SkillTagSuggestionResponse(
        Long skillId,
        String name,
        String category,
        double score
) {
    public static SkillTagSuggestionResponse of(Skill skill, double score) {
        return new SkillTagSuggestionResponse(
                skill.getId(),
                skill.getName(),
                skill.getCategory(),
                score
        );
    }
}

