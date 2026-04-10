package com.devnear.web.dto.map;

import lombok.Builder;
import lombok.Getter;

/**
 * 주소 검색 결과 응답 DTO
 */
@Getter
@Builder
public class AddressSearchResponse {
    private String address;      // 전체 주소
    private String roadAddress;  // 도로명 주소
    private String jibunAddress; // 지번 주소
    private Double latitude;     // 위도
    private Double longitude;    // 경도
    private String placeName;    // 장소명 (선택)
}
