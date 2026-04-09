package com.devnear.web.dto.freelancer;

import com.devnear.web.domain.enums.WorkStyle;
import lombok.Getter;

import java.util.List;

@Getter
public class FreelancerProfileRequest {

    private String profileImageUrl;
    private String introduction;
    private String location;
    private Double latitude;   // 위도
    private Double longitude;  // 경도
    private Integer hourlyRate;// 시급
    private WorkStyle workStyle;  // 업무 방식 (ONLINE, OFFLINE, HYBRID)
    private Boolean isActive;
    
    private List<Long> skillIds;
}
