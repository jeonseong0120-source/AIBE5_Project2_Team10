package com.devnear.web.service.skill;

import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.dto.skill.SkillCreateRequest;
import com.devnear.web.dto.skill.SkillResponse;
import com.devnear.web.dto.skill.SkillTagSuggestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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

    public List<SkillTagSuggestionResponse> suggestTagsFromText(String rawText, Integer limit, String context) {
        String text = normalize(rawText);
        if (text.isBlank()) {
            return List.of();
        }
        int topN = limit == null ? 8 : Math.min(Math.max(1, limit), 20);

        List<Skill> allSkills = skillRepository.findAll();
        List<ScoredSkill> scored = new ArrayList<>();
        for (Skill skill : allSkills) {
            String skillName = normalize(skill.getName());
            if (skillName.isBlank()) {
                continue;
            }
            double score = scoreSkill(text, skillName);
            if (score > 0) {
                scored.add(new ScoredSkill(skill, score));
            }
        }

        // context 값은 차후 도메인별 규칙(예: portfolio/project 가중치)으로 확장하기 위한 파라미터로 유지
        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredSkill::score).reversed()
                        .thenComparing(s -> s.skill().getName()))
                .limit(topN)
                .map(s -> SkillTagSuggestionResponse.of(s.skill(), round3(s.score())))
                .collect(Collectors.toList());
    }

    private static double scoreSkill(String text, String skillName) {
        // 1) 전체 문자열 포함 매칭 (가장 강한 신호)
        if (text.contains(skillName)) {
            return 1.0;
        }

        // 2) 약어/표기 변형 룰 (nextjs, springboot 같은 공백/기호 제거 케이스)
        String compactText = compact(text);
        String compactSkill = compact(skillName);
        if (!compactSkill.isBlank() && compactText.contains(compactSkill)) {
            return 0.9;
        }

        // 3) 토큰 교집합 비율
        String[] skillTokens = skillName.split("\\s+");
        int matched = 0;
        for (String token : skillTokens) {
            if (token.isBlank()) continue;
            if (text.contains(token)) {
                matched++;
            }
        }
        if (matched == 0) {
            return 0.0;
        }
        return 0.45 + 0.45 * ((double) matched / skillTokens.length);
    }

    private static String normalize(String value) {
        if (value == null) return "";
        String lowered = value.toLowerCase(Locale.ROOT);
        // 영문/숫자/한글/일부 기호만 남기고 공백 정리
        return lowered
                .replaceAll("[^a-z0-9가-힣+#./\\-\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String compact(String value) {
        return value.replaceAll("[\\s./\\-]", "");
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private record ScoredSkill(Skill skill, double score) {
    }
}
