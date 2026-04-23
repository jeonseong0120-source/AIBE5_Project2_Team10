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
    private final UserRepository userRepository;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth/redirect}")
    private String redirectUri;

    @Value("${app.oauth2.error-uri:http://localhost:3000/login}")
    private String errorUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OAuth2 인증 성공 후 유저를 찾을 수 없습니다: " + email));

        if (user.getStatus() == UserStatus.WITHDRAWN) {
            log.warn("OAuth2 로그인 차단 - 탈퇴한 계정: {}", email);
            getRedirectStrategy().sendRedirect(request, response, errorUri + "?error=account_withdrawn");
            return;
        }

        Long userId = user.getId();
        String role = user.getRole().name();
        String status = user.getStatus().name(); // 🎯 상태값 추출

        // 🎯 [수정] status 포함하여 토큰 발급
        String accessToken = jwtTokenProvider.createToken(userId, email, role, status);

        String targetUrl = redirectUri + "#token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}