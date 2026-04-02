package com.devnear.web.dto.user;

import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.user.User;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserRegisterRequest {
    private String email;
    private String password;
    private String name;
    private String nickname;
    private Role role;

    public User toEntity(String encodedPassword) {
        return User.builder()
                .email(email)
                .password(encodedPassword) // 암호화된 비번 저장
                .name(name)
                .nickname(nickname)
                .role(role)
                .build();
    }
}