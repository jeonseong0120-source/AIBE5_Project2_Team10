package com.devnear.web.controller.payment;

import com.devnear.web.dto.payment.PaymentConfirmRequest;
import com.devnear.web.dto.payment.PaymentResponse;
import com.devnear.web.service.payment.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = {"/api/payments", "/api/v1/payments"})
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 결제 내역 생성 (결제창 띄우기 전 단계)
     */
    @PostMapping("/prepare")
    public ResponseEntity<Void> preparePayment(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.devnear.web.domain.user.User user,
            @RequestBody @Valid com.devnear.web.dto.payment.PaymentPrepareRequest request) {
        paymentService.preparePayment(user, request);
        return ResponseEntity.ok().build();
    }

    /**
     * 결제 최종 승인 엔드포인트
     */
    @PostMapping("/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(@RequestBody @Valid PaymentConfirmRequest request) {
        return ResponseEntity.ok(paymentService.confirmPayment(request));
    }
}
