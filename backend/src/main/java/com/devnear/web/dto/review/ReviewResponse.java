package com.devnear.web.dto.review;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private BigDecimal averageScore;
    private String comment;
}