package com.devnear.global.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@Getter
public class TossPaymentConfig {

    @Value("${payment.toss.test-secret-key:test_sk_Z61z40qa867k799Xpv0A3z9XmE7L}")
    private String secretKey;

    @Value("${payment.toss.test-client-key:test_ck_D5b4Zne68qqDbg1mGnrVpM7n0N7v}")
    private String clientKey;

    @Value("${payment.toss.success-url:http://localhost:3000/client/payment/success}")
    private String successUrl;

    @Value("${payment.toss.fail-url:http://localhost:3000/client/payment/fail}")
    private String failUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
