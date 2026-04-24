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
import org.springframework.security.authentication.DisabledException;

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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        //  웹소켓 핸드셰이크는 필터 통과
        if (uri.equals("/ws") || uri.startsWith("/ws/")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = resolveToken(request);

        try {
            if (token != null) {
                // 1. 토큰 자체 유효성 검사 (만료, 변조 등)
                jwtTokenProvider.validateToken(token);

                // 2. 유저 정보 로드 (여기서 UsernameNotFoundException 발생 가능)
                Authentication authentication = jwtTokenProvider.getAuthentication(token);

                // 3. [코드래빗 피드백] 계정 상태 체크 (활성화 여부)
                if (authentication.getPrincipal() instanceof UserDetails userDetails && !userDetails.isEnabled()) {
                    throw new DisabledException("비활성화된 계정입니다: " + userDetails.getUsername());
                }

                // 모든 검증 통과 시 컨텍스트에 등록
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("인증 성공: {}", authentication.getName());
            }
        }
        // [보안 강화] 삭제된 유저나 없는 유저인 경우
        catch (UsernameNotFoundException e) {
            log.warn("인증 실패: 존재하지 않는 계정입니다.");
            SecurityContextHolder.clearContext();
        }
        // [보안 강화] 정지된 계정인 경우
        catch (DisabledException e) {
            log.warn("인증 실패: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }
        // [보안 강화] 토큰 문제 (만료, 위조 등)
        catch (JwtException | IllegalArgumentException e) {
            log.warn("인증 실패: 유효하지 않은 토큰입니다. ({})", e.getMessage());
            SecurityContextHolder.clearContext();
        }
        catch (Exception e) {
            log.error("인증 처리 중 예기치 않은 서버 오류 발생", e);
            SecurityContextHolder.clearContext();
        }

        // [중요] 어떤 경우에도 필터 체인은 계속 이어져야 함 (그래야 시큐리티가 401/403을 던짐)
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