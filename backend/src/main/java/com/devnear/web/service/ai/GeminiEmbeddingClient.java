package com.devnear.web.service.ai;

import com.devnear.global.config.GeminiEmbeddingProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gemini {@code :embedContent} REST API로 텍스트를 벡터로 변환합니다.
 *
 * @see <a href="https://ai.google.dev/api/rest/v1beta/models.embedContent">embedContent</a>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiEmbeddingClient {

    private static final int MAX_CHARS = 14_000;

    private final RestClient geminiRestClient;
    private final GeminiEmbeddingProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * @throws IllegalStateException API 키 미설정
     * @throws IllegalArgumentException 응답에 임베딩이 없거나 차원이 0인 경우
     */
    public double[] embedText(String rawText) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new IllegalStateException("gemini.api-key (GEMINI_API_KEY) is not configured");
        }
        String text = truncate(rawText == null ? "" : rawText, MAX_CHARS);
        if (text.isBlank()) {
            throw new IllegalArgumentException("Cannot embed empty text");
        }

        String modelId = properties.getEmbeddingModel();
        String uri = "/models/" + modelId + ":embedContent";

        Map<String, Object> part = new HashMap<>();
        part.put("text", text);
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        Map<String, Object> body = new HashMap<>();
        body.put("model", "models/" + modelId);
        body.put("content", content);

        try {
            String json = geminiRestClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (json == null || json.isBlank()) {
                throw new IllegalArgumentException("Empty Gemini embed response");
            }
            JsonNode root = objectMapper.readTree(json);
            JsonNode values = root.path("embedding").path("values");
            if (!values.isArray() || values.isEmpty()) {
                throw new IllegalArgumentException("Gemini response missing embedding.values");
            }
            List<Double> tmp = new ArrayList<>(values.size());
            for (JsonNode n : values) {
                tmp.add(n.asDouble());
            }
            return tmp.stream().mapToDouble(Double::doubleValue).toArray();
           } catch ( RestClientResponseException  e ) {
            log.warn ( "Gemini embed HTTP {}" , e.getStatusCode () . value ( ) ) ;
            throw  new  IllegalStateException ( "Gemini 임베드 요청 실패: HTTP " + e.getStatusCode (). value ( ), e ) ;
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Gemini embed failed", e);
        }
    }

    private static String truncate(String s, int max) {
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max);
    }
}
