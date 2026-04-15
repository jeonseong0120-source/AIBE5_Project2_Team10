package com.devnear.web.domain.enums;

/**
 * 클라이언트가 프리랜서에게 보낸 프로젝트 제안 상태.
 */
public enum ProjectProposalStatus {
    /** 프리랜서 응답 대기 */
    PENDING,
    /** 프리랜서 수락 */
    ACCEPTED,
    /** 프리랜서 거절 */
    REJECTED,
    /** 클라이언트가 제안 취소 */
    CANCELLED
}
