package com.devnear.web.dto.skill;

import lombok.Getter;

@Getter
public class SkillCreateRequest {

    private String name; // 스킬 이름
    private String category; // 카테고리 (예: "데이터베이스", "백엔드", "프론트엔드")
}
