package com.devnear.global.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

/**
 * .env 의 {@code DB_URL=jdbc:mysql://...} 와 고정 P6SpyDriver 조합을 허용합니다.
 * P6SpyDriver 는 {@code jdbc:p6spy:mysql://...} 만 받으므로 URL 을 보정합니다.
 */
public class P6SpyJdbcUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String URL_KEY = "spring.datasource.url";
    private static final String DRIVER_KEY = "spring.datasource.driver-class-name";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty(URL_KEY);
        String driver = environment.getProperty(DRIVER_KEY);
        if (url == null || driver == null) {
            return;
        }
        if (!driver.toLowerCase().contains("p6spy")) {
            return;
        }
        if (url.startsWith("jdbc:p6spy:")) {
            return;
        }
        if (!(url.startsWith("jdbc:mysql:") || url.startsWith("jdbc:mariadb:"))) {
            return;
        }
        String fixed = "jdbc:p6spy:" + url.substring("jdbc:".length());
        environment.getPropertySources().addFirst(
                new MapPropertySource("p6spyJdbcUrlRewrite", Map.of(URL_KEY, fixed)));
    }

    /** config import(.env 등) 이 반영된 뒤에 돌도록 가장 늦게 실행 */
    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
