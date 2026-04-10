package com.devnear.global.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final UserDetailsService userDetailsService;
    private final SecretKey key; // final 유지
    private final long validityInMilliseconds; // final 유지

    // 2. 생성자를 통해 설정값(@Value)과 의존성(UserDetailsService)을 한꺼번에 주입
    public JwtTokenProvider(
            UserDetailsService userDetailsService,
            @Value("${jwt.secret}") String secretString,
            @Value("${jwt.expiration}") long validityInMilliseconds
    ) {
        this.userDetailsService = userDetailsService;
        this.validityInMilliseconds = validityInMilliseconds;
        // 주입받은 secretString으로 여기서 Key를 생성합니다.
        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    // 1. 토큰 생성 (기존 로직 유지, 필드값 사용)
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

    /**
     * 토큰의 유효성을 검사합니다.
     * @throws JwtException | IllegalArgumentException 토큰이 유효하지 않을 경우 발생
     */
    public void validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            // 검증 성공 시 아무것도 하지 않고 통과
        } catch (JwtException | IllegalArgumentException e) {
            // 에러를 삼키지 않고 다시 던짐
            // 이렇게 해야 Filter의 catch 블록에서 로그를 상세히 남길 수 있음
            throw e;
        }
    }

    public Authentication getAuthentication(String token) {
        String email = getEmail(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }

    public String getEmail(String token) {
        return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
    }
}