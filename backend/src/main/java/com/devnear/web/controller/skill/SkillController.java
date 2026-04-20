package com.devnear.web.controller.skill;

import com.devnear.web.dto.skill.SkillResponse;
import com.devnear.web.dto.skill.SkillTagSuggestRequest;
import com.devnear.web.dto.skill.SkillTagSuggestionResponse;
import com.devnear.web.service.skill.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// [보고] 프론트엔드 버전 규칙 통일을 위해 v1 경로 추가 허용
@RequestMapping(value = {"/api/skills", "/api/v1/skills"})
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    /**
     * [보고] 전체 스킬 목록 조회 (비로그인 허용)
     */
    @GetMapping
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    /**
     * [보고] 기본 제공 스킬 목록 조회 (비로그인 허용)
     */
    @GetMapping("/default")
    public ResponseEntity<List<SkillResponse>> getDefaultSkills() {
        return ResponseEntity.ok(skillService.getDefaultSkills());
    }

    /**
     * [보고] 카테고리별 스킬 조회 (비로그인 허용)
     */
    @GetMapping("/category")
    public ResponseEntity<List<SkillResponse>> getSkillsByCategory(
            @RequestParam String name) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(name));
    }

    /**
     * [보고] 스킬 이름 검색 (통합 검색 - 스킬 태그 #, 비로그인 허용)
     */
    @GetMapping("/search")
    public ResponseEntity<List<SkillResponse>> searchSkills(
            @RequestParam String keyword) {
        return ResponseEntity.ok(skillService.searchSkills(keyword));
    }

    /**
     * [보고] 커스텀 스킬 등록 (is_default = false)
     * [권한] FREELANCER 또는 BOTH 역할만 접근 가능 (SecurityConfig에서 제어)
     */
    @PostMapping
    public ResponseEntity<SkillResponse> addCustomSkill(
            @RequestBody com.devnear.web.dto.skill.SkillCreateRequest request) {
        return ResponseEntity.ok(skillService.addCustomSkill(request));
    }

    /**
     * [보고] 스킬 삭제
     * [권한] FREELANCER 또는 BOTH 역할만 접근 가능 (SecurityConfig에서 제어)
     */
    @DeleteMapping("/{skillId}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long skillId) {
        skillService.deleteSkill(skillId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 포트폴리오/공고 설명 텍스트 기반 스킬 태그 추천.
     * - context: portfolio | project (옵션)
     * - limit: 1~20 (기본 8)
     */
    @PostMapping("/suggest")
    public ResponseEntity<List<SkillTagSuggestionResponse>> suggestTagsFromText(
            @Valid @RequestBody SkillTagSuggestRequest request) {
        return ResponseEntity.ok(
                skillService.suggestTagsFromText(
                        request.getText(),
                        request.getLimit(),
                        request.getContext()
                )
        );
    }
}
