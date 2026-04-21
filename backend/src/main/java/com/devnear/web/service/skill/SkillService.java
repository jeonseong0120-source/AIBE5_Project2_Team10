package com.devnear.web.service.skill;

import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.dto.skill.SkillCreateRequest;
import com.devnear.web.dto.skill.SkillResponse;
import com.devnear.web.dto.skill.SkillTagSuggestionResponse;
import com.devnear.web.service.ai.GeminiSkillTagSuggestionClient;
import com.devnear.web.service.ai.GeminiSkillTagSuggestionClient.GeminiSkillPick;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillService {

    private static final int NLP_CATALOG_CAP = 220;

    private final SkillRepository skillRepository;
    private final GeminiSkillTagSuggestionClient geminiSkillTagSuggestionClient;

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
        if (allSkills.isEmpty()) {
            return List.of();
        }

        if (geminiSkillTagSuggestionClient.isConfigured()) {
            try {
                List<Skill> catalog = catalogForNlp(text, allSkills);
                List<GeminiSkillPick> picks = geminiSkillTagSuggestionClient.suggestFromDocument(
                        rawText, context, catalog, topN);
                if (!picks.isEmpty()) {
                    Map<Long, Skill> byId = allSkills.stream()
                            .filter(s -> s.getId() != null)
                            .collect(Collectors.toMap(Skill::getId, Function.identity(), (a, b) -> a));
                    List<SkillTagSuggestionResponse> nlp = new ArrayList<>();
                    for (GeminiSkillPick pick : picks) {
                        Skill sk = byId.get(pick.skillId());
                        if (sk != null) {
                            nlp.add(SkillTagSuggestionResponse.of(sk, round3(pick.confidence())));
                        }
                    }
                    if (!nlp.isEmpty()) {
                        return nlp;
                    }
                }
            } catch (Exception e) {
                log.warn("NLP 스킬 추출 실패, 규칙 기반으로 대체: {}", e.getMessage());
            }
        }

        return heuristicSuggestTagsFromText(text, allSkills, topN);
    }

    /**
     * NLP 프롬프트 길이 제한 — 후보가 많으면 문자열 매칭 점수로 상위만 골라 Gemini에 넘깁니다.
     */
    private List<Skill> catalogForNlp(String normalizedDoc, List<Skill> allSkills) {
        if (allSkills.size() <= NLP_CATALOG_CAP) {
            return allSkills;
        }
        List<ScoredSkill> scored = new ArrayList<>();
        for (Skill skill : allSkills) {
            String skillName = normalize(skill.getName());
            if (skillName.isBlank()) {
                continue;
            }
            double score = scoreSkill(normalizedDoc, skillName);
            if (score > 0) {
                scored.add(new ScoredSkill(skill, score));
            }
        }
        scored.sort(Comparator.comparingDouble(ScoredSkill::score).reversed()
                .thenComparing(s -> s.skill().getName()));
        List<Skill> pick = scored.stream()
                .map(ScoredSkill::skill)
                .limit(NLP_CATALOG_CAP)
                .collect(Collectors.toList());
        if (pick.size() < NLP_CATALOG_CAP) {
            Set<Long> seen = pick.stream().map(Skill::getId).collect(Collectors.toCollection(LinkedHashSet::new));
            for (Skill s : allSkills) {
                if (pick.size() >= NLP_CATALOG_CAP) {
                    break;
                }
                if (s.getId() != null && seen.add(s.getId())) {
                    pick.add(s);
                }
            }
        }
        return pick;
    }

    private List<SkillTagSuggestionResponse> heuristicSuggestTagsFromText(
            String normalizedDoc, List<Skill> allSkills, int topN) {
        List<ScoredSkill> scored = new ArrayList<>();
        for (Skill skill : allSkills) {
            String skillName = normalize(skill.getName());
            if (skillName.isBlank()) {
                continue;
            }
            double score = scoreSkill(normalizedDoc, skillName);
            if (score > 0) {
                scored.add(new ScoredSkill(skill, score));
            }
        }
        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredSkill::score).reversed()
                        .thenComparing(s -> s.skill().getName()))
                .limit(topN)
                .map(s -> SkillTagSuggestionResponse.of(s.skill(), round3(s.score())))
                .collect(Collectors.toList());
    }

    /** 짧은 스킬 토큰(1~2글자)은 문서 토큰과 완전 일치할 때만 매칭합니다. */
    private static final int SHORT_TOKEN_MAX_LEN = 2;

    private static double scoreSkill(String text, String skillName) {
        if (text.isBlank() || skillName.isBlank()) {
            return 0.0;
        }
        List<String> docTokens = splitMatchTokens(text);
        List<String> skillTokens = splitMatchTokens(skillName);
        if (skillTokens.isEmpty()) {
            return 0.0;
        }

        // 1) 정규화된 문서에서 스킬 이름이 연속 토큰으로 등장 (부분 문자열/다른 단어 내부 매칭 방지)
        if (containsConsecutiveTokens(docTokens, skillTokens)) {
            return 1.0;
        }

        // 2) 약어/표기 변형 룰 (nextjs, springboot 같은 공백/기호 제거 케이스)
        String compactText = compact(text);
        String compactSkill = compact(skillName);
        if (!compactSkill.isBlank()) {
            if (compactSkill.length() <= SHORT_TOKEN_MAX_LEN) {
                for (String docToken : docTokens) {
                    if (compact(docToken).equals(compactSkill)) {
                        return 0.9;
                    }
                }
            } else if (compactText.contains(compactSkill)) {
                return 0.9;
            }
        }

        // 3) 토큰 교집합 비율 — 문서 토큰과 동일한 토큰만 카운트; 짧은 토큰도 동일 규칙(전체 단어 일치)
        int matched = 0;
        for (String token : skillTokens) {
            if (docContainsSkillToken(docTokens, token)) {
                matched++;
            }
        }
        if (matched == 0) {
            return 0.0;
        }
        return 0.45 + 0.45 * ((double) matched / skillTokens.size());
    }

    private static List<String> splitMatchTokens(String normalized) {
        return Arrays.stream(normalized.split("\\s+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /** {@code phrase}가 {@code doc} 안에 연속 부분열로 등장하는지(토큰 단위, 대소문자는 이미 normalize됨). */
    private static boolean containsConsecutiveTokens(List<String> doc, List<String> phrase) {
        if (phrase.isEmpty() || phrase.size() > doc.size()) {
            return false;
        }
        outer:
        for (int i = 0; i <= doc.size() - phrase.size(); i++) {
            for (int j = 0; j < phrase.size(); j++) {
                if (!doc.get(i + j).equals(phrase.get(j))) {
                    continue outer;
                }
            }
            return true;
        }
        return false;
    }

    private static boolean docContainsSkillToken(List<String> docTokens, String skillToken) {
        if (skillToken.isEmpty()) {
            return false;
        }
        for (String docToken : docTokens) {
            if (docToken.equals(skillToken)) {
                return true;
            }
        }
        return false;
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
