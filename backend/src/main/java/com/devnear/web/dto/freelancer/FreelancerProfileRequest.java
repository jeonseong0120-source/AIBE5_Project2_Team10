package com.devnear.web.dto.freelancer;

import com.devnear.web.domain.enums.WorkStyle;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class FreelancerProfileRequest {

    @Size(max = 50, message = "닉네임은 50자 이내로 입력해 주세요.")
    private String userName;
    private String profileImageUrl;

    @Size(max = 4000, message = "소개글은 4000자 이내로 입력해 주세요.")
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
    @Size(min = 1, max = 50, message = "스킬은 1개 이상 50개 이하로 선택해 주세요.")
    private List<Long> skillIds;
}
