// dto/matching/FreelancerMatchingResponse.java
package com.devnear.web.dto.matching;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class FreelancerMatchingResponse {
    private Long profileId;
    private String nickname;
    private String profileImageUrl;
    private String introduction;
    private Double averageRating;
    private Integer completedProjects;
    private List<String> skills;
    private Boolean isActive;

    // 🎯 [수정] 매칭률
    private Integer matchingRate;

    // 🎯 [추가] 지도와 거리 표시를 위한 필드
    private Double distance;  // 계산된 거리 (km 단위)
    private Double latitude;  // 프리랜서 위도
    private Double longitude; // 프리랜서 경도
}