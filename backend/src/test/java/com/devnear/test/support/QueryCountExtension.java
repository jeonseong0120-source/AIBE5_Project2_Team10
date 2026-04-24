package com.devnear.test.support;

import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

/**
 * 각 테스트 메서드 전후로 {@link QueryCountHolder} 스레드 로컬을 초기화하고,
 * 메서드 종료 시점의 JDBC 실행 횟수를 한 줄로만 출력합니다.
 * 통합 테스트 콘솔에서 스프링 부트 INFO와 섞이지 않도록 표준 출력에만 한 줄 씁니다.
 */
public class QueryCountExtension implements BeforeEachCallback, AfterEachCallback {

    @Override
    public void beforeEach(ExtensionContext context) {
        QueryCountHolder.start();
    }

    @Override
    public void afterEach(ExtensionContext context) {
        int selects = QueryCountHolder.selectExecutions();
        int total = QueryCountHolder.totalExecutions();
        System.out.println(String.format(
                "[쿼리카운트] 테스트=%s | SELECT %d회 | JDBC 문 실행(전체) %d회",
                context.getDisplayName(),
                selects,
                total));
        QueryCountHolder.clear();
    }
}
