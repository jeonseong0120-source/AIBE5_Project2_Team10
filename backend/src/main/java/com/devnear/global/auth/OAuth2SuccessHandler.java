package com.devnear.global.auth;

import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository; // 🎯 확실한 정보 조회를 위해 DB 의존성 주입

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth/redirect}")
    private String redirectUri;

    @Value("${app.oauth2.error-uri:http://localhost:3000/login}")
    private String errorUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        // 1. 🎯 구글이 준 이메일로 우리 DB에서 '진짜' 유저 정보를 조회합니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OAuth2 인증 성공 후 유저를 찾을 수 없습니다: " + email));

        // 2. 유저 상태 검증 (탈퇴 유저 입구 컷)
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            log.warn("OAuth2 로그인 차단 - 탈퇴한 계정: {}", email);
            getRedirectStrategy().sendRedirect(request, response, errorUri + "?error=account_withdrawn");
            return;
        }

        // 3. 🎯 토큰 재료 준비 (안전하게 DB 엔티티 사용)
        Long userId = user.getId();
        String role = user.getRole().name();
        String status = user.getStatus().name(); // 🎯 누락되었던 4번째 인자 추가

        // 4. 우리 서비스 전용 JWT 토큰 발급 (인자 4개 매칭 완료!)
        String accessToken = jwtTokenProvider.createToken(userId, email, role, status);

        // 5. 보안 강화를 위해 프래그먼트(#token=) 사용
        String targetUrl = redirectUri + "#token=" + accessToken;

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}