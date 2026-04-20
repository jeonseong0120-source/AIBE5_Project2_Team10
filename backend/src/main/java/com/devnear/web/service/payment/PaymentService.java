package com.devnear.web.service.payment;

import com.devnear.global.service.TossPaymentClient;
import com.devnear.web.domain.payment.Payment;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.dto.payment.PaymentConfirmRequest;
import com.devnear.web.dto.payment.PaymentResponse;
import com.devnear.web.exception.PaymentAmountMismatchException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final TossPaymentClient tossPaymentClient;

    /**
     * 결제 내역 생성 (결제창 띄우기 전 단계)
     */
    @Transactional
    public void preparePayment(com.devnear.web.domain.user.User user, com.devnear.web.dto.payment.PaymentPrepareRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다."));

        // 프로젝트 소유자 검증
        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new com.devnear.web.exception.ProjectAccessDeniedException("본인의 프로젝트만 결제할 수 있습니다.");
        }

        // 결제 금액 검증
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("유효하지 않은 결제 금액입니다.");
        }

        // 수수료 5% 계산 (부동 소수점 오차 방지를 위해 정수 연산 사용)
        long amount = request.getAmount();
        long fee = amount * 5 / 100;
        long netAmount = amount - fee;

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .fee(fee)
                .netAmount(netAmount)
                .orderName(request.getOrderName())
                .project(project)
                .status(com.devnear.web.domain.enums.PaymentStatus.READY)
                .build();

        paymentRepository.save(payment);
    }

    /**
     * 최종 결제 승인 로직
     */
    @Transactional
    public PaymentResponse confirmPayment(com.devnear.web.domain.user.User user, PaymentConfirmRequest request) {
        // 1. 기존 결제 대기 내역 조회
        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("결제 정보를 찾을 수 없습니다."));

        // [추가] 결제 소유권 검증 (프로젝트 소유자만 승인 가능)
        if (!payment.getProject().getClientProfile().getUser().getId().equals(user.getId())) {
            throw new com.devnear.web.exception.ProjectAccessDeniedException("본인의 결제 내역만 승인할 수 있습니다.");
        }

        // 2. 금액 변조 검증
        if (!payment.getAmount().equals(request.getAmount())) {
            throw new PaymentAmountMismatchException("결제 금액이 일치하지 않습니다.");
        }

        // 3. 토스페이먼츠 서버 승인 요청
        Map<String, Object> response = tossPaymentClient.confirmPayment(request);

        // 4. 결제 상태 업데이트
        String method = (String) response.get("method");
        payment.confirm(request.getPaymentKey(), method);

        // 5. 프로젝트 상태 변경 (진행 중으로 변경)
        Project project = payment.getProject();
        if (project != null) {
            project.start();
        }

        return PaymentResponse.from(payment);
    }
}
