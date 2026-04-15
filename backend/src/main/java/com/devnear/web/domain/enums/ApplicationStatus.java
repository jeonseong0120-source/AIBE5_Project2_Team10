package com.devnear.web.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 프로젝트 지원서의 현재 상태(진행 단계)를 나타냅니다.
 */
@Getter
@RequiredArgsConstructor
public enum ApplicationStatus {
    PENDING("검토대기"),
    ACCEPTED("수락됨"),
    REJECTED("거절됨"),
    CANCELLED("지원취소");

    private final String description;
}
