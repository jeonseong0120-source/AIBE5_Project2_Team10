package com.devnear.global.config;

import com.p6spy.engine.spy.P6SpyOptions;
import com.p6spy.engine.spy.appender.StdoutLogger;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile; // 👈 임포트 추가!

@Configuration
// 🎯 [수정] prod(운영) 프로파일이 아닐 때만 이 설정을 빈으로 등록
// local, dev, test 등 개발 환경에서만 작동하
@Profile("!prod")
public class P6SpyConfig {

    @PostConstruct
    public void setLogMessageFormat() {
        // 1. 로그 포맷터 설정
        P6SpyOptions.getActiveInstance().setLogMessageFormat(P6SpyFormatter.class.getName());

        // 2. 로그 출력 대상을 '콘솔'로 설정
        P6SpyOptions.getActiveInstance().setAppender(StdoutLogger.class.getName());
    }
}