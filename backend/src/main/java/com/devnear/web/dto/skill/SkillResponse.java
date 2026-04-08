package com.devnear.web.dto.skill;

import com.devnear.web.domain.skill.Skill;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SkillResponse {

    private Long skillId;
    private String name;
    private String category;
    private Boolean isDefault;

    public static SkillResponse from(Skill skill) {
        return SkillResponse.builder()
                .skillId(skill.getId())
                .name(skill.getName())
                .category(skill.getCategory())
                .isDefault(skill.getIsDefault())
                .build();
    }
}
