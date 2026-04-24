package com.devnear.test.support;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * JDBC statement 실행 횟수(스레드 단위). 통합 테스트에서 N+1·과다 쿼리 회귀를 숫자로 잡을 때 사용합니다.
 */
public final class QueryCountHolder {

    private static final ThreadLocal<Counts> CURRENT = new ThreadLocal<>();

    private QueryCountHolder() {
    }

    /** 현재 테스트 메서드 시작 시 호출해 카운터를 0으로 둡니다. */
    public static void start() {
        CURRENT.set(new Counts());
    }

    /** 카운터만 0으로 리셋합니다(같은 테스트 안에서 arrange 이후 act만 셀 때). */
    public static void reset() {
        Counts c = CURRENT.get();
        if (c == null) {
            CURRENT.set(new Counts());
        } else {
            c.reset();
        }
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static void recordStatementExecution(String sql) {
        Counts c = CURRENT.get();
        if (c != null) {
            c.record(sql);
        }
    }

    public static int totalExecutions() {
        Counts c = CURRENT.get();
        return c == null ? 0 : c.totalExecutions();
    }

    public static int selectExecutions() {
        Counts c = CURRENT.get();
        return c == null ? 0 : c.selectExecutions();
    }

    public static final class Counts {
        private final AtomicInteger totalExecutions = new AtomicInteger();
        private final AtomicInteger selectExecutions = new AtomicInteger();

        void record(String sql) {
            totalExecutions.incrementAndGet();
            if (sql != null) {
                String t = sql.trim();
                if (t.length() >= 6 && t.regionMatches(true, 0, "select", 0, 6)) {
                    selectExecutions.incrementAndGet();
                }
            }
        }

        public void reset() {
            totalExecutions.set(0);
            selectExecutions.set(0);
        }

        public int totalExecutions() {
            return totalExecutions.get();
        }

        public int selectExecutions() {
            return selectExecutions.get();
        }
    }
}
