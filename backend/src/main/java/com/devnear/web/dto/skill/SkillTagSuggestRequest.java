package com.devnear.web.dto.skill;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Getter
@Setter
public class SkillTagSuggestRequest {

    @NotBlank(message = "text는 비어 있을 수 없습니다.")
    @Size(max = 8000, message = "text는 8000자를 초과할 수 없습니다.")
    private String text;
    /** portfolio | project 같은 호출 컨텍스트(옵션) */
    @Size(max = 32, message = "context는 32자를 초과할 수 없습니다.")
    private String context;

    @Min(value = 1, message = "limit는 1 이상이어야 합니다.")
    @Max(value = 20, message = "limit는 20 이하여야 합니다.")
    private Integer limit = 8;
}