package com.devnear.web.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 역제안(Proposal)의 현재 상태를 나타냅니다.
 */
@Getter
@RequiredArgsConstructor
public enum ProposalStatus {
    PENDING("검토대기"),
    ACCEPTED("수락됨"),
    REJECTED("거절됨");

    private final String description;
}
