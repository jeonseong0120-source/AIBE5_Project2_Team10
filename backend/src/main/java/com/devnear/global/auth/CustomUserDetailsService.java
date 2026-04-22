package com.devnear.global.auth;

import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Cacheable(value = "users", key = "#email", sync = true)
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        // 1. 유저를 먼저 찾아서 변수에 담습니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 2. 상태를 체크합니다. (UserStatus.WITHDRAWN 체크)
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new DisabledException("탈퇴한 계정입니다.");
        }

        // 3. 마지막에 SecurityUser로 변환하여 반환합니다.
        return new SecurityUser(user);
    }
}