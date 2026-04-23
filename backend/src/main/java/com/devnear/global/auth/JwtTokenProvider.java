package com.devnear.global.auth;

import com.devnear.global.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long validityInMilliseconds;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.validityInMilliseconds = jwtProperties.getExpiration();
        String secretString = jwtProperties.getSecret();
        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    // 🎯 [수정] status 파라미터 추가 및 claim에 저장
    public String createToken(Long userId, String email, String role, String status) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .header().add("typ", "JWT").and()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .claim("status", status) // 추가됨
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public void validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
        } catch (JwtException | IllegalArgumentException e) {
            throw e;
        }
    }

    public Authentication getAuthentication(String token) {
        Claims claims = getClaims(token);

        Number userIdNumber = claims.get("userId", Number.class);
        Long userId = userIdNumber != null ? userIdNumber.longValue() : null;

        String email = claims.getSubject();
        String role = claims.get("role", String.class);
        String status = claims.get("status", String.class); // 🎯 상태 꺼내기

        if (userId == null || email == null || email.isBlank() || role == null || role.isBlank()) {
            throw new JwtException("JWT 필수 클레임이 누락되었습니다.");
        }

        // 🎯 [수정] SecurityUser 생성자에 status 전달 (SecurityUser 클래스도 이전 가이드대로 4개짜리 생성자로 수정되어 있어야 합니다)
        SecurityUser principal = new SecurityUser(userId, email, role, status);

        return new UsernamePasswordAuthenticationToken(
                principal,
                "",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }
}