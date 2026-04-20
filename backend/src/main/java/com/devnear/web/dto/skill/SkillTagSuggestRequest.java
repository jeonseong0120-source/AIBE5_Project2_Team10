package com.devnear.web.dto.skill;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillTagSuggestRequest {

    @NotBlank(message = "text는 비어 있을 수 없습니다.")
    private String text;

    /** portfolio | project 같은 호출 컨텍스트(옵션) */
    private String context;

    private Integer limit = 8;
}

