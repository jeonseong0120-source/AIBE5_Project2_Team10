package com.devnear.web.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String tokenType; // "Bearer" 라고 넣어줄 겁니다.
}