package com.devnear.global.config;

import com.p6spy.engine.spy.P6SpyOptions;
import com.p6spy.engine.spy.appender.StdoutLogger;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class P6SpyConfig {

    @PostConstruct
    public void setLogMessageFormat() {
        // 1. 로그 포맷터 설정 (이미 하신 것)
        P6SpyOptions.getActiveInstance().setLogMessageFormat(P6SpyFormatter.class.getName());

        // 2. [필수 추가] 로그 출력 대상을 '콘솔'로 설정합니다.
        // 이 설정이 없으면 내부적으로 포맷팅만 하고 아무데도 출력하지 않습니다!
        P6SpyOptions.getActiveInstance().setAppender(StdoutLogger.class.getName());
    }
}