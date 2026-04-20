package com.devnear.global.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Configuration
@Getter
public class TossPaymentConfig {

    @Value("${TOSS_PAYMENT_SECRET_KEY}")
    private String secretKey;

    @Value("${TOSS_PAYMENT_CLIENT_KEY}")
    private String clientKey;

    @Value("${TOSS_PAYMENT_SUCCESS_URL}")
    private String successUrl;

    @Value("${TOSS_PAYMENT_FAIL_URL}")
    private String failUrl;

    @PostConstruct
    public void validatePaymentConfig() {
        if (!StringUtils.hasText(secretKey)) {
            throw new IllegalStateException("Toss Payment Secret Key is missing. Please check TOSS_PAYMENT_SECRET_KEY in .env");
        }
        if (!StringUtils.hasText(clientKey)) {
            throw new IllegalStateException("Toss Payment Client Key is missing. Please check TOSS_PAYMENT_CLIENT_KEY in .env");
        }
        if (!StringUtils.hasText(successUrl)) {
            throw new IllegalStateException("Toss Payment Success URL is missing. Please check TOSS_PAYMENT_SUCCESS_URL in .env");
        }
        if (!StringUtils.hasText(failUrl)) {
            throw new IllegalStateException("Toss Payment Fail URL is missing. Please check TOSS_PAYMENT_FAIL_URL in .env");
        }
    }

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return new RestTemplate(factory);
    }
}
