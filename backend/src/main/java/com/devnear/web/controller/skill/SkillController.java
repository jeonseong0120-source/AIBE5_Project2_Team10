package com.devnear.web.controller.skill;

import com.devnear.web.dto.skill.SkillResponse;
import com.devnear.web.service.skill.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    // 전체 스킬 목록 조회
    // GET /api/skills
    @GetMapping
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    // 기본 제공 스킬 목록 조회
    // GET /api/skills/default
    @GetMapping("/default")
    public ResponseEntity<List<SkillResponse>> getDefaultSkills() {
        return ResponseEntity.ok(skillService.getDefaultSkills());
    }

    // 카테고리별 스킬 조회
    // GET /api/skills/category?name={name}
    @GetMapping("/category")
    public ResponseEntity<List<SkillResponse>> getSkillsByCategory(
            @RequestParam String name) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(name));
    }

    // 스킬 이름 검색 (통합 검색 - 스킬 태그 #)
    // GET /api/skills/search?keyword={keyword}
    @GetMapping("/search")
    public ResponseEntity<List<SkillResponse>> searchSkills(
            @RequestParam String keyword) {
        return ResponseEntity.ok(skillService.searchSkills(keyword));
    }

    // 커스텀 스킬 등록 (is_default = false)
    // POST /api/skills
    // body: { "name": "Rust", "category": "시스템" }
    @PostMapping
    public ResponseEntity<SkillResponse> addCustomSkill(
            @RequestBody com.devnear.web.dto.skill.SkillCreateRequest request) {
        return ResponseEntity.ok(skillService.addCustomSkill(request));
    }

    // 스킬 삭제
    // DELETE /api/skills/{skillId}
    @DeleteMapping("/{skillId}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long skillId) {
        skillService.deleteSkill(skillId);
        return ResponseEntity.noContent().build();
    }
}