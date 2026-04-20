package com.devnear.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Google Generative Language API (Gemini) 임베딩 호출 설정.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "gemini")
public class GeminiEmbeddingProperties {

    /**
     * Google AI Studio / Vertex 등에서 발급한 API 키. 환경 변수 {@code GEMINI_API_KEY} 권장.
     */
    private String apiKey = "";

    /**
     * REST 베이스 URL (버전 prefix 포함).
     */
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    /**
     * {@code embedContent}에 사용할 모델 id (경로에만 사용, body의 model 필드와 일치).
     */
    private String embeddingModel = "gemini-embedding-001";
}
