package com.devnear.web.service.payment;

import com.devnear.global.service.TossPaymentClient;
import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.enums.PaymentSource;
import com.devnear.web.domain.payment.Payment;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.dto.payment.PaymentConfirmRequest;
import com.devnear.web.dto.payment.PaymentResponse;
import com.devnear.web.exception.PaymentAmountMismatchException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectApplicationRepository projectApplicationRepository;
    private final ProposalRepository proposalRepository;
    private final TossPaymentClient tossPaymentClient;
    private final ApplicationEventPublisher eventPublisher;

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

        // 중복 결제 내역 처리 및 락 확보 (OneToOne 관계 대응)
        paymentRepository.findByProjectIdForUpdate(request.getProjectId()).ifPresent(existingPayment -> {
            if (existingPayment.getStatus() == com.devnear.web.domain.enums.PaymentStatus.DONE) {
                throw new IllegalStateException("이미 결제가 완료된 프로젝트입니다.");
            }
            // 이미 결제된 건이 아니라면 기존 전결제 내역(READY)을 삭제하여 레이스 컨디션 및 PK 이슈 방지
            paymentRepository.deleteByProjectId(request.getProjectId());
            paymentRepository.flush();
        });


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
                .applicationId(request.getApplicationId())
                .source(request.getSource())
                .status(com.devnear.web.domain.enums.PaymentStatus.READY)
                .build();

        paymentRepository.save(payment);
    }

    /**
     * 최종 결제 승인 로직
     */
    @Transactional
    public PaymentResponse confirmPayment(com.devnear.web.domain.user.User user, PaymentConfirmRequest request) {
        // 1. 기존 결제 대기 내역 조회 (동시성 방지를 위한 비관적 락 적용)
        Payment payment = paymentRepository.findByOrderIdForUpdate(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("결제 정보를 찾을 수 없습니다."));

        // [추가] 결제 소유권 검증 (프로젝트 소유자만 승인 가능)
        if (!payment.getProject().getClientProfile().getUser().getId().equals(user.getId())) {
            throw new com.devnear.web.exception.ProjectAccessDeniedException("본인의 결제 내역만 승인할 수 있습니다.");
        }

        // 2. 금액 변조 검증
        if (!payment.getAmount().equals(request.getAmount())) {
            throw new PaymentAmountMismatchException("결제 금액이 일치하지 않습니다.");
        }

        // 3. 로컬 선행 조건 검증 (Fail-fast)
        // 결제 상태가 READY가 아니면 중단 (이미 DONE인 경우 멱등성 보장을 위해 결과 반환)
        if (payment.getStatus() != com.devnear.web.domain.enums.PaymentStatus.READY) {
            if (payment.getStatus() == com.devnear.web.domain.enums.PaymentStatus.DONE) {
                return PaymentResponse.from(payment);
            }
            throw new IllegalStateException("결제 승인이 가능한 상태가 아닙니다. 현재 상태: " + payment.getStatus());
        }

        // 프로젝트 상태 검증 (모집 중인 프로젝트만 결제 가능)
        if (payment.getProject().getStatus() != com.devnear.web.domain.enums.ProjectStatus.OPEN) {
            throw new IllegalStateException("모집 중인 프로젝트만 결제할 수 있습니다. 현재 상태: " + payment.getProject().getStatus());
        }

        // 4. 결제 대상(지원서/제안서) 존재 및 상태 검증 (추가된 보안 로직)
        if (payment.getApplicationId() == null || payment.getSource() == null) {
            throw new IllegalStateException("결제 대상 정보가 누락되었습니다.");
        }

        if (payment.getSource() == PaymentSource.PROPOSAL) {
            proposalRepository.findById(payment.getApplicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("대상 제안서를 찾을 수 없습니다. ID: " + payment.getApplicationId()));
        } else {
            projectApplicationRepository.findById(payment.getApplicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("대상 지원서를 찾을 수 없습니다. ID: " + payment.getApplicationId()));
        }

        // 5. 토스페이먼츠 서버 승인 요청 (데모 모드인 경우 건너뜀)
        Map<String, Object> response;
        if (request.getPaymentKey().startsWith("mock_")) {
            // 데모용 가짜 응답 생성
            response = java.util.Map.of("method", "간편결제(DEMO)");
        } else {
            response = tossPaymentClient.confirmPayment(request);
        }

        // 6. 결제 상태 업데이트
        String method = (String) response.get("method");
        payment.confirm(request.getPaymentKey(), method);

        // 6. 프로젝트 및 지원서 상태 변경
        Project project = payment.getProject();
        if (project != null) {
            // 프로젝트 시작
            project.start();

            // [추가] 수락된 지원서/제안서 상태 변경 및 프리랜서 할당
            if (payment.getApplicationId() != null) {
                if (payment.getSource() == PaymentSource.PROPOSAL) {
                    // 역제안(Proposal) 처리
                    proposalRepository.findById(payment.getApplicationId()).ifPresent(proposal -> {
                        proposal.updateStatus(ProposalStatus.ACCEPTED);
                        project.assignFreelancer(proposal.getFreelancerProfile());
                    });
                } else {
                    // 일반 지원(Application) 처리
                    projectApplicationRepository.findById(payment.getApplicationId()).ifPresent(application -> {
                        application.updateStatus(ApplicationStatus.ACCEPTED);
                        project.assignFreelancer(application.getFreelancerProfile());
                    });
                }

                // 해당 프로젝트의 다른 모든 대기 지원자들(Applications) 거절 처리
                projectApplicationRepository.findByProjectIdWithFreelancerSorted(project.getId())
                        .stream()
                        .filter(a -> payment.getSource() != PaymentSource.APPLICATION || !a.getId().equals(payment.getApplicationId()))
                        .filter(a -> a.getStatus() == ApplicationStatus.PENDING)
                        .forEach(a -> a.updateStatus(ApplicationStatus.REJECTED));

                // [추가] 해당 프로젝트의 다른 모든 대기 제안들(Proposals) 거절 처리
                proposalRepository.findAllByProjectId(project.getId())
                        .stream()
                        .filter(p -> payment.getSource() != PaymentSource.PROPOSAL || !p.getId().equals(payment.getApplicationId()))
                        .filter(p -> p.getStatus() == ProposalStatus.PENDING)
                        .forEach(p -> p.updateStatus(ProposalStatus.REJECTED));
            }

            Long clientUserId = project.getClientProfile().getUser().getId();
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment.getId(), project.getId(), clientUserId));
        }

        return PaymentResponse.from(payment);
    }
}
