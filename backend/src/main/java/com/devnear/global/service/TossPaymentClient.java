package com.devnear.global.service;

import com.devnear.global.config.TossPaymentConfig;
import com.devnear.web.dto.payment.PaymentConfirmRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TossPaymentClient {

    private final TossPaymentConfig tossPaymentConfig;
    private final RestTemplate restTemplate;

    private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    /**
     * 토스페이먼츠 결제 승인 API 호출
     */
    public Map<String, Object> confirmPayment(PaymentConfirmRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encodeSecretKey(tossPaymentConfig.getSecretKey()));
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<PaymentConfirmRequest> entity = new HttpEntity<>(request, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(CONFIRM_URL, entity, Map.class);
            
            if (response == null) {
                throw new com.devnear.web.exception.PaymentGatewayException("Toss Payment API returned a null response.");
            }
            
            return response;
        } catch (org.springframework.web.client.RestClientException e) {
            throw new com.devnear.web.exception.PaymentGatewayException("Error occurred while calling Toss Payment API: " + e.getMessage(), e);
        }
    }

    /**
     * Secret Key를 Base64로 인코딩 (토스 API 인증 규격)
     */
    private String encodeSecretKey(String secretKey) {
        String auth = secretKey + ":";
        return Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
    }
}
