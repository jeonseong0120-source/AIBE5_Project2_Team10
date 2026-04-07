package com.devnear.global.auth;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 모든 HTTP 요청에서 JWT 토큰의 유효성을 검증하는 보안 필터(Security Filter)
 * FilterChain의 전두에 위치하여 인증되지 않은 사용자의 접근을 1차적으로 차단합니다.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) // [수정완료] 타입을 FilterChain으로 정확히 맞췄습니다.
            throws ServletException, IOException {

        // 1. 요청 헤더(Authorization)에서 JWT 토큰을 추출합니다.
        String token = resolveToken(request);

        try {
            // 2. 토큰이 존재하면 유효성 검사를 진행합니다.
            if (token != null) {
                // validateToken이 이제 에러를 던지므로 유효하지 않으면 아래 catch로 바로 날아갑니다.
                jwtTokenProvider.validateToken(token);

                /*
                 * [보안 강화 지점]
                 * 토큰은 유효하지만 DB에 유저가 없는 경우(탈퇴 등)를 대비합니다.
                 * getAuthentication 내부의 loadUserByUsername 호출 시 UsernameNotFoundException이 발생할 수 있습니다.
                 */
                Authentication authentication = jwtTokenProvider.getAuthentication(token);

                /*
                 * [코드래빗 Major 지적 반영]
                 * 토큰은 정상이지만 계정이 정지/비활성화(UserStatus.ACTIVE가 아님)된 경우를 체크합니다.
                 */
                if (authentication.getPrincipal() instanceof UserDetails userDetails && !userDetails.isEnabled()) {
                    log.warn("비활성화된 계정의 접근 시도입니다: {}", userDetails.getUsername());
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                // 모든 검증을 통과하면 인증 정보 등록
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("인증 성공: {}", authentication.getName());
            }
        } catch (UsernameNotFoundException e) {
            log.warn("존재하지 않는 계정의 접근 시도입니다.");
            SecurityContextHolder.clearContext();
        } catch (JwtException | IllegalArgumentException e) {
            // 이제 validateToken이 던지는 구체적인 에러 메시지를 로그에 남깁니다.
            log.warn("유효하지 않은 JWT 토큰입니다: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        } catch (Exception e) {
            log.error("인증 처리 중 예기치 않은 오류가 발생했습니다.", e);
            SecurityContextHolder.clearContext();
        }

        // 3. 다음 필터로 요청을 넘깁니다.
        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 요청 헤더에서 "Authorization: Bearer <Token>" 접두사를 제거하고 순수 토큰 값만 추출합니다.
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim();
        }
        return null;
    }
}