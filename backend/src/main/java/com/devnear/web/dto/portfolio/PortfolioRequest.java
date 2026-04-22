package com.devnear.web.dto.portfolio;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class PortfolioRequest {

    @NotBlank(message = "포트폴리오 제목은 필수입니다.")
    @Size(max = 100, message = "포트폴리오 제목은 100자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "상세 설명(desc)은 필수입니다.")
    @Size(max = 2000, message = "상세 설명은 2000자 이하로 입력해주세요.")
    private String desc; // 기획안의 desc

    @Size(max = 2083, message = "썸네일 URL 길이가 너무 깁니다.")
    private String thumbnailUrl; // 썸네일은 선택사항 (null 시 프론트 자체 기본이미지 렌더링)

    @NotNull(message = "포트폴리오 다중 이미지(portfolioImages) 필드는 필수입니다.")
    @NotEmpty(message = "포트폴리오 상세 이미지는 1장 이상 등록해야 합니다.")
    private List<@NotBlank @Size(max = 2000) String> portfolioImages;

    @NotNull(message = "스킬 목록(skills) 파라미터는 필수입니다.")
    @NotEmpty(message = "최소 1개 이상의 스킬을 등록해야 합니다.")
    @Size(min = 1, max = 5, message = "포트폴리오 스킬은 1개 이상 5개 이하로 선택해 주세요.")
    private List<@NotNull @Min(1) Long> skills;
}
