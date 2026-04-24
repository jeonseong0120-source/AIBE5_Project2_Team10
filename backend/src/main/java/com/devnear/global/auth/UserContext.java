package com.devnear.global.auth;

import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

@Component
@RequiredArgsConstructor
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class UserContext {

    private final UserRepository userRepository;
    private User currentUser;

    /**
     * 🎯 [핵심] 현재 요청에서 유저 엔티티를 딱 한 번만 조회하여 공유합니다.
     */
    public User getCurrentUser() {
        if (currentUser == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof SecurityUser principal)) {
                return null;
            }
            // ID로 조회하여 N+1 방지용 @EntityGraph가 적용된 메서드 호출
            currentUser = userRepository.findWithProfilesById(principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("요청한 유저를 찾을 수 없습니다. ID: " + principal.getId()));
        }
        return currentUser;
    }
}