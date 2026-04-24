package com.devnear.test.config;

import com.devnear.test.support.QueryCountingDataSource;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;

/**
 * 통합 테스트 컨텍스트의 {@code dataSource} 빈을 {@link QueryCountingDataSource}로 한 겹 감쌉니다.
 * 사용하는 테스트 클래스에 {@code @Import(QueryCountingTestConfiguration.class)} 를 추가하세요.
 */
@TestConfiguration
public class QueryCountingTestConfiguration {

    @Bean
    static BeanPostProcessor queryCountingDataSourcePostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (!"dataSource".equals(beanName)) {
                    return bean;
                }
                if (bean instanceof DataSource dataSource && !(bean instanceof QueryCountingDataSource)) {
                    return new QueryCountingDataSource(dataSource);
                }
                return bean;
            }
        };
    }
}
