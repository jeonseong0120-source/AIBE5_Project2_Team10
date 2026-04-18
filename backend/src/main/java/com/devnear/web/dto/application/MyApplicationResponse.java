package com.devnear.web.dto.application;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * [FRE-05] 프리랜서 본인이 지원한 목록을 조회할 때 쓰이는 응답 데이터입니다.
 */
@Getter
@Builder
public class MyApplicationResponse {

    private Long applicationId;
    private Long projectId;
    private String projectName;         // 지원한 공고 이름
    private String clientCompanyName;   // 공고를 올린 원청(클라이언트) 회사명
    private String message;             // 🎯 [추가] 지원 시 작성했던 메시지
    private Integer bidPrice;           // 내가 불렀던 희망 페이
    private ApplicationStatus status;   // 현재 지원 상태 (대기/수락/거절)
    private LocalDateTime appliedAt;    // 지원한 날짜시간

    public static MyApplicationResponse from(ProjectApplication app) {
        return MyApplicationResponse.builder()
                .applicationId(app.getId())
                .projectId(app.getProject().getId())
                .projectName(app.getProject().getProjectName())
                .clientCompanyName(app.getClientProfile().getCompanyName())
                .bidPrice(app.getBidPrice())
                .status(app.getStatus())
                .appliedAt(app.getCreatedAt())
                .message(app.getMessage())
                .build();
    }
}
