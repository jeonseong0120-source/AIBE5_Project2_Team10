package com.devnear.web.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPrepareRequest {
    @NotBlank(message = "주문 ID는 필수입니다.")
    private String orderId;

    @NotNull(message = "결제 금액은 필수입니다.")
    @Positive(message = "결제 금액은 양수여야 합니다.")
    private Long amount;

    @NotBlank(message = "주문명은 필수입니다.")
    private String orderName;

    @NotNull(message = "프로젝트 ID는 필수입니다.")
    @Positive(message = "유효하지 않은 프로젝트 ID입니다.")
    private Long projectId;

    @NotNull(message = "지원서 ID는 필수입니다.")
    @Positive(message = "유효하지 않은 지원서 ID입니다.")
    private Long applicationId;

    @NotBlank(message = "구분(source)은 필수입니다.")
    private String source;
}
