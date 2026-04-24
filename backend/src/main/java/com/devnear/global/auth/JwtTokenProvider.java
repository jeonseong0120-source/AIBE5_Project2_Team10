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

    public String createToken(Long userId, String email, String role, String status) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .header().add("typ", "JWT").and()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .claim("status", status) // 🎯 이 부분도 필수!
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

    /**
     * 🎯 [최적화] DB 조회 없이 토큰의 Claim만으로 인증 객체를 생성합니다.
     * 필터 단계에서의 불필요한 DB 조회를 제거하여 성능을 극대화합니다.
     */
    public Authentication getAuthentication(String token) {
        Claims claims = getClaims(token);

        // 🎯 [핵심 해결책] Integer든 Long이든 일단 Number로 안전하게 꺼낸 뒤, 강제로 Long으로 바꿉니다!
        Number userIdNumber = claims.get("userId", Number.class);
        Long userId = userIdNumber != null ? userIdNumber.longValue() : null;

        String email = claims.getSubject();
        String role = normalizeRoleClaim(claims.get("role", String.class));

        // ROLE_ 접두사가 없으면 붙여주는 안전장치 (스프링 시큐리티 꼰대질 방어)
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        SecurityUser principal = new SecurityUser(userId, email, role);

        return new UsernamePasswordAuthenticationToken(
                principal,
                "",
                Collections.singletonList(new SimpleGrantedAuthority(role))
        );
    }
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * OAuth 성공 핸들러 등에서 JWT에 {@code ROLE_FREELANCER} 형태로 넣은 레거시 클레임과,
     * 일반 로그인의 {@code FREELANCER} 형태를 모두 {@code FREELANCER}로 맞춥니다.
     * 그렇지 않으면 권한이 {@code ROLE_ROLE_FREELANCER}가 되어 403이 납니다.
     */
    private static String normalizeRoleClaim(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        return raw.startsWith("ROLE_") ? raw.substring("ROLE_".length()) : raw;
    }

    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }
}