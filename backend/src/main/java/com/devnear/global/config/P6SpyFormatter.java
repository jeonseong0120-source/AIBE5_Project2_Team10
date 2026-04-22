package com.devnear.global.config;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;
import org.hibernate.engine.jdbc.internal.FormatStyle;

import java.util.Locale;

public class P6SpyFormatter implements MessageFormattingStrategy {

    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category, String prepared, String sql, String url) {
        sql = formatSql(category, sql);
        if (sql.trim().isEmpty()) return "";

        // 실행 시간(Execution Time)을 ms 단위로 출력하여 성능 모니터링을 돕습니다.
        return String.format("\n[P6Spy] Execution Time: %d ms | %s", elapsed, sql);
    }

    private String formatSql(String category, String sql) {
        if (sql == null || sql.trim().isEmpty()) return "";

        // SQL 문장에 대해 포맷팅을 수행합니다.
        if (Category.STATEMENT.getName().equals(category)) {
            String tempSql = sql.trim().toLowerCase(Locale.ROOT);
            if (tempSql.startsWith("create") || tempSql.startsWith("alter") || tempSql.startsWith("comment")) {
                return FormatStyle.DDL.getFormatter().format(sql);
            } else {
                return FormatStyle.BASIC.getFormatter().format(sql);
            }
        }
        return sql;
    }
}