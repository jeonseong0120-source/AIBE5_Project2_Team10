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

    public String createToken(Long userId, String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .header().add("typ", "JWT").and()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
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

        Long userId = claims.get("userId", Long.class);
        String email = claims.getSubject();
        String role = normalizeRoleClaim(claims.get("role", String.class));

        // SecurityUser는 마스터의 프로젝트에 정의된 Principal 객체라고 가정합니다.
        // DB 조회를 생략하고 토큰 정보로만 구성된 SecurityUser를 넘깁니다.
        SecurityUser principal = new SecurityUser(userId, email, role);

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