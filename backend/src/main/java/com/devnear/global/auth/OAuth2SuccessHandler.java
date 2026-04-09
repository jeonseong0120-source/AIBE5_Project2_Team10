package com.devnear.global.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 1. 유저 상태 검증 (WITHDRAWN 상태인 탈퇴 유저만 입구 컷)
        String status = (String) attributes.get("status");
        if ("WITHDRAWN".equals(status)) {
            log.warn("OAuth2 로그인 차단 - 탈퇴한 계정: {}", attributes.get("email"));
            // 탈퇴한 계정임을 알리는 프론트엔드 에러 페이지로 리다이렉트
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:3000/login?error=account_withdrawn");
            return;
        }

        // 2. 토큰 재료 준비
        Long userId = (Long) attributes.get("id");
        String email = (String) attributes.get("email");
        String role = authentication.getAuthorities().iterator().next().getAuthority();

        // 3. 우리 서비스 전용 JWT 토큰 발급
        String accessToken = jwtTokenProvider.createToken(userId, email, role);

        // 4. 보안 강화를 위해 쿼리 스트링(?token=) 대신 프래그먼트(#token=) 사용
        String targetUrl = "http://localhost:3000/oauth/redirect#token=" + accessToken;

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
