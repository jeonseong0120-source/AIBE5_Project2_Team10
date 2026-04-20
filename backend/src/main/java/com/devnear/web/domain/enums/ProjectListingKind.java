package com.devnear.web.domain.enums;

/**
 * 공고 노출·추천 범위. 제안서(FORM)로만 만들어진 단독 프로젝트는 마켓/AI 추천에서 제외합니다.
 */
public enum ProjectListingKind {
    /** 일반 모집 공고 (탐색·AI 추천 대상) */
    MARKETPLACE,
    /** 역제안 전용으로 생성된 단독 공고 (동일 {@code projects} 테이블, 마켓 비노출) */
    PROPOSAL_STANDALONE
}
