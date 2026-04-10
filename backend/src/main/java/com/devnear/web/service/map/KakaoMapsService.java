package com.devnear.web.service.map;

import com.devnear.global.config.KakaoMapsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Kakao Maps API 연동 서비스
 * 주소 검색 및 좌표 변환 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoMapsService {

    private final KakaoMapsProperties kakaoMapsProperties;
    private static final String KAKAO_API_BASE_URL = "https://dapi.kakao.com";

    /**
     * 주소 검색 API
     */
    public String searchAddress(String address) {
        // 보안을 위해 address 원본 로그 기록을 지양합니다.

        if (!isApiKeyConfigured()) {
            throw new IllegalStateException("Kakao Maps REST API key is not configured");
        }

        // TODO: 실제 API 연동 구현 시 주석 해제 및 구현 완료 필요
        /*
        RestClient restClient = RestClient.create();
        String response = restClient.get()
            .uri(KAKAO_API_BASE_URL + "/v2/local/search/address.json?query={query}", address)
            .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoMapsProperties.getRestApiKey())
            .retrieve()
            .body(String.class);
        return response;
        */

        throw new UnsupportedOperationException("Kakao Maps address search is not implemented yet");
    }

    /**
     * 좌표로 주소 검색 API (Reverse Geocoding)
     */
    public String getAddressByCoordinates(Double latitude, Double longitude) {
        // 보안을 위해 latitude, longitude 원본 로그 기록을 지양합니다.

        if (!isApiKeyConfigured()) {
            throw new IllegalStateException("Kakao Maps REST API key is not configured");
        }

        // TODO: 실제 API 연동 구현 시 주석 해제 및 구현 완료 필요
        /*
        RestClient restClient = RestClient.create();
        String response = restClient.get()
            .uri(KAKAO_API_BASE_URL + "/v2/local/geo/coord2address.json?x={x}&y={y}",
                longitude, latitude)
            .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoMapsProperties.getRestApiKey())
            .retrieve()
            .body(String.class);
        return response;
        */

        throw new UnsupportedOperationException("Kakao Maps coordinate-to-address conversion is not implemented yet");
    }

    /**
     * 키워드로 장소 검색 API
     */
    public String searchPlace(String keyword) {
        // 키워드는 로그 기록이 가능하지만, 보안 정책에 따라 조절할 수 있습니다.

        if (!isApiKeyConfigured()) {
            throw new IllegalStateException("Kakao Maps REST API key is not configured");
        }

        // TODO: 실제 API 연동 구현 시 주석 해제 및 구현 완료 필요
        /*
        RestClient restClient = RestClient.create();
        String response = restClient.get()
            .uri(KAKAO_API_BASE_URL + "/v2/local/search/keyword.json?query={query}", keyword)
            .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoMapsProperties.getRestApiKey())
            .retrieve()
            .body(String.class);
        return response;
        */

        throw new UnsupportedOperationException("Kakao Maps place search is not implemented yet");
    }

    /**
     * API Key 설정 여부 확인
     */
    public boolean isApiKeyConfigured() {
        String key = kakaoMapsProperties.getRestApiKey();
        return StringUtils.hasText(key)
                && !"your-kakao-rest-api-key".equals(key.trim());
    }
}