package com.devnear.global.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final String secretString = "devnear-project-secret-key-for-jwt-token-issuance-2026";
    private final SecretKey key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    private final long validityInMilliseconds = 3600000; // 1시간

    public String createToken(Long userId, String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        // 0.12.6 버전 신규 문법 (Builder 방식이 더 명확해짐)
        return Jwts.builder()
                .header().add("typ", "JWT").and() // 헤더 설정
                .subject(email) // 유저 식별값
                .claim("userId", userId) // 커스텀 데이터
                .claim("role", role)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key) // 알고리즘을 직접 안 적어도 key 타입을 보고 자동 선택함
                .compact();
    }
}