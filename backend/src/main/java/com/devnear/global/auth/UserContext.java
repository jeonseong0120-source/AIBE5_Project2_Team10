package com.devnear.global.auth;

import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
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

    public User getCurrentUserOrNull() {
        if (currentUser == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof SecurityUser principal)) {
                return null;
            }
            currentUser = userRepository.findWithProfilesById(principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("요청한 유저를 찾을 수 없습니다. ID: " + principal.getId()));
        }
        return currentUser;
    }


    public User getRequiredCurrentUser() {
        User user = getCurrentUserOrNull();
        if (user == null) {
            throw new AuthenticationCredentialsNotFoundException("인증된 사용자 정보가 필요합니다.");
        }
        return user;
    }
}