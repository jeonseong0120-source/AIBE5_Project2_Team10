package com.devnear.web.domain.payment;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.PaymentStatus;
import com.devnear.web.domain.project.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderId; // 우리가 생성한 주문번호

    @Column(unique = true)
    private String paymentKey; // 토스에서 발급한 고유 키

    @Column(nullable = false)
    private Long amount; // 총 결제 금액

    @Column(nullable = false)
    private Long fee; // 플랫폼 수수료 (5%)

    @Column(nullable = false)
    private Long netAmount; // 실 정산 금액 (총액 - 수수료)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; // 결제 상태

    private String method; // 결제 수단 (카드, 가상계좌 등)

    private String orderName; // 주문명 (프로젝트 제목 등)

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project; // 연관된 프로젝트

    // 결제 완료 처리
    public void confirm(String paymentKey, String method) {
        // 이미 완료된 경우 (멱등성 처리)
        if (this.status == PaymentStatus.DONE) {
            return;
        }

        // 상태 가드: READY 상태에서만 승인 가능
        if (this.status != PaymentStatus.READY) {
            throw new IllegalStateException("결제 승인은 READY 상태에서만 가능합니다. 현재 상태: " + this.status);
        }

        this.paymentKey = paymentKey;
        this.method = method;
        this.status = PaymentStatus.DONE;
    }

    // 구매 확정 처리
    public void confirmPurchase() {
        // 이미 확정된 경우 (멱등성 처리)
        if (this.status == PaymentStatus.PURCHASE_CONFIRMED) {
            return;
        }

        // 상태 가드: DONE 상태에서만 구매 확정 가능
        if (this.status != PaymentStatus.DONE) {
            throw new IllegalStateException("구매 확정은 결제가 완료된(DONE) 상태에서만 가능합니다. 현재 상태: " + this.status);
        }

        this.status = PaymentStatus.PURCHASE_CONFIRMED;
    }
}
