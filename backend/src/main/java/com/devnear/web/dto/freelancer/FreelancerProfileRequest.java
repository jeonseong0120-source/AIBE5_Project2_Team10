package com.devnear.web.dto.freelancer;

import com.devnear.web.domain.enums.WorkStyle;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;

import java.util.List;

@Getter
public class FreelancerProfileRequest {

    private String profileImageUrl;
    private String introduction;
    private String location;
    @NotNull(message = "위도(latitude)는 필수 항목입니다.")
    @Min(-90)
    @Max(90)
    private Double latitude;   // 위도
    
    @NotNull(message = "경도(longitude)는 필수 항목입니다.")
    @Min(-180)
    @Max(180)
    private Double longitude;  // 경도
    
    @NotNull(message = "시급(hourlyRate)은 필수 항목입니다.")
    @PositiveOrZero(message = "시급은 0 이상이어야 합니다.")
    private Integer hourlyRate;// 시급
    private WorkStyle workStyle;  // 업무 방식 (ONLINE, OFFLINE, HYBRID)
    private Boolean isActive;
    
    @NotNull(message = "스킬 목록(skillIds)은 필수 항목입니다.")
    @NotEmpty(message = "최소 1개 이상의 스킬을 선택해야 합니다.")
    private List<Long> skillIds;
}
