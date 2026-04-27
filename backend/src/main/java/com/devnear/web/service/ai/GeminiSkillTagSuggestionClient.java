package com.devnear.web.service.ai;

import com.devnear.global.config.GeminiEmbeddingProperties;
import com.devnear.web.domain.skill.Skill;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gemini {@code generateContent}로 문서에서 스킬 태그를 추출합니다.
 * 응답의 스킬 id는 반드시 호출 시 전달한 카탈로그에 존재하는 값만 허용합니다.
 */
@Slf4j
@Service
public class GeminiSkillTagSuggestionClient {

    private static final int MAX_DOCUMENT_CHARS = 12_000;

    private final RestClient geminiGenerationRestClient;
    private final GeminiEmbeddingProperties properties;
    private final ObjectMapper objectMapper;

    public GeminiSkillTagSuggestionClient(
            @Qualifier("geminiGenerationRestClient") RestClient geminiGenerationRestClient,
            GeminiEmbeddingProperties properties,
            ObjectMapper objectMapper) {
        this.geminiGenerationRestClient = geminiGenerationRestClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return properties.getApiKey() != null && !properties.getApiKey().isBlank();
    }

    /**
     * @param context {@code portfolio} | {@code project} 등 UI에서 넘긴 맥락
     */
    public List<GeminiSkillPick> suggestFromDocument(String rawText, String context, List<Skill> catalog, int limit) {
        if (!isConfigured()) {
            throw new IllegalStateException("GEMINI_API_KEY not configured");
        }
        if (catalog == null || catalog.isEmpty()) {
            return List.of();
        }
        int topN = Math.min(Math.max(1, limit), 20);
        String document = truncate(rawText == null ? "" : rawText, MAX_DOCUMENT_CHARS);
        if (document.isBlank()) {
            return List.of();
        }

        String ctx = (context == null || context.isBlank()) ? "unknown" : context.trim().toLowerCase(Locale.ROOT);
        final String prompt;
        try {
            prompt = buildUserPrompt(ctx, topN, catalog, document);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize skill catalog for Gemini", e);
        }

        String modelId = properties.getGenerationModel();
        if (modelId == null || modelId.isBlank()) {
            modelId = "gemini-2.0-flash";
        }
        String uri = "/models/" + modelId + ":generateContent";

        Map<String, Object> userPart = new HashMap<>();
        userPart.put("text", prompt);
        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        userContent.put("parts", List.of(userPart));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.15);
        generationConfig.put("maxOutputTokens", 2048);
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(userContent));
        body.put("generationConfig", generationConfig);

        try {
            String responseJson = geminiGenerationRestClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                return List.of();
            }
            String text = extractTextFromGenerateContent(responseJson);
            if (text == null || text.isBlank()) {
                return List.of();
            }
            return parseSkillPicks(unwrapJsonBlock(text), catalog, topN);
        } catch (RestClientResponseException e) {
            log.warn("Gemini generateContent HTTP {} for skill suggest", e.getStatusCode().value());
            throw new IllegalStateException("Gemini generateContent failed: HTTP " + e.getStatusCode().value(), e);
        } catch (JsonProcessingException e) {
            log.warn("Gemini skill suggest JSON parse failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildUserPrompt(String context, int limit, List<Skill> catalog, String document)
            throws JsonProcessingException {
        List<Map<String, Object>> rows = new ArrayList<>(catalog.size());
        for (Skill s : catalog) {
            if (s.getId() == null || s.getName() == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", s.getId());
            row.put("name", s.getName().trim());
            rows.add(row);
        }
        String catalogJson = objectMapper.writeValueAsString(rows);

        return "You label freelancing platform skill tags. Read DOCUMENT (Korean or English) and pick the most relevant skills from ALLOWED_SKILLS_JSON only.\n\n"
                + "Rules:\n"
                + "1. Output ONLY valid JSON: {\"skills\":[{\"skillId\":<long>,\"confidence\":<number 0..1>},...]} .\n"
                + "2. Every skillId MUST be an \"id\" from ALLOWED_SKILLS_JSON. Never invent ids or output free-text skill names.\n"
                + "3. Sort by confidence descending. At most " + limit + " items.\n"
                + "4. If nothing fits, return {\"skills\":[]}.\n"
                + "5. CONTEXT=" + context + " — portfolio: personal work / portfolio description; project: client job posting.\n"
                + "6. Korean colloquial tech terms map to the closest English \"name\" in ALLOWED_SKILLS_JSON when the text clearly implies that tool/stack "
                + "(e.g. 스프링/스프링으로 → Spring Boot; 피그마 → Figma; 도커 → Docker; 리액트 → React; 타입스크립트 → TypeScript; "
                + "마이에스큐엘/마이에스큐 → MySQL; 에이더블유에스 or AWS → AWS). "
                + "If DOCUMENT ends with [KO_ALIAS_HINTS: ...], treat those names as strongly supported by Korean wording.\n\n"
                + "ALLOWED_SKILLS_JSON:\n"
                + catalogJson
                + "\n\nDOCUMENT:\n"
                + document;
    }

    private String extractTextFromGenerateContent(String responseJson) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return null;
        }
        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return null;
        }
        return parts.get(0).path("text").asText(null);
    }

    private List<GeminiSkillPick> parseSkillPicks(String jsonText, List<Skill> catalog, int limit) throws JsonProcessingException {
        Map<Long, Skill> allowed = catalog.stream()
                .filter(s -> s.getId() != null)
                .collect(Collectors.toMap(Skill::getId, s -> s, (a, b) -> a));

        JsonNode root = objectMapper.readTree(jsonText);
        JsonNode skills = root.path("skills");
        if (!skills.isArray()) {
            return List.of();
        }

        Map<Long, Double> bestById = new HashMap<>();
        for (JsonNode n : skills) {
            if (!n.hasNonNull("skillId")) {
                continue;
            }
            long id = n.path("skillId").asLong(-1);
            if (id < 0 || !allowed.containsKey(id)) {
                continue;
            }
            double conf = n.path("confidence").asDouble(0.5);
            conf = Math.max(0, Math.min(1, conf));
            bestById.merge(id, conf, Math::max);
        }
        return bestById.entrySet().stream()
                .map(e -> new GeminiSkillPick(e.getKey(), e.getValue()))
                .sorted((a, b) -> Double.compare(b.confidence(), a.confidence()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private static String unwrapJsonBlock(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNl = t.indexOf('\n');
            int fence = t.lastIndexOf("```");
            if (firstNl > 0 && fence > firstNl) {
                t = t.substring(firstNl + 1, fence).trim();
            }
        }
        return t;
    }

    private static String truncate(String s, int max) {
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max);
    }

    public record GeminiSkillPick(long skillId, double confidence) {
    }
}
