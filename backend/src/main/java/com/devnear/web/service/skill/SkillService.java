package com.devnear.web.service.skill;

import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.dto.skill.SkillCreateRequest;
import com.devnear.web.dto.skill.SkillResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillService {

    private final SkillRepository skillRepository;

    // 전체 스킬 목록 조회
    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll()
                .stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    // 기본 제공 스킬 목록 조회 (is_default = true)
    public List<SkillResponse> getDefaultSkills() {
        return skillRepository.findByIsDefaultTrue()
                .stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    // 카테고리별 스킬 조회
    public List<SkillResponse> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category)
                .stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    // 스킬 이름 검색 (통합 검색 - 스킬 태그 #)
    public List<SkillResponse> searchSkills(String keyword) {
        return skillRepository.findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());
    }

    // 커스텀 스킬 등록 (is_default = false)
    @Transactional
    public SkillResponse addCustomSkill(SkillCreateRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        String category = request.getCategory() != null ? request.getCategory().trim() : "";

        if (name.isEmpty()) {
            throw new IllegalArgumentException("스킬 이름은 비어있을 수 없습니다.");
        }

        if (skillRepository.existsByName(name)) {
            throw new IllegalArgumentException("이미 존재하는 스킬입니다: " + name);
        }

        Skill skill = Skill.builder()
                .name(name)
                .category(category)
                .isDefault(false)
                .build();
        
        try {
            return SkillResponse.from(skillRepository.save(skill));
        } catch (DataIntegrityViolationException e) {
            // 다른 사용자가 0.001초 차이로 먼저 같은 이름의 스킬을 저장했을 때 방어
            throw new IllegalArgumentException("이미 존재하는 스킬입니다: " + name);
        }
    }

    // 스킬 삭제
    @Transactional
    public void deleteSkill(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new IllegalArgumentException("존재하지 않는 스킬입니다.");
        }
        skillRepository.deleteById(skillId);
    }
}
