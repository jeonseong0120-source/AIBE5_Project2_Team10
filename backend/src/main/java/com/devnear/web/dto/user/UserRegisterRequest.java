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
        // 닉네임이 없으면 이메일 앞부분을 임시로 사용
        String finalNickname = (nickname == null || nickname.isBlank())
                ? email.split("@")[0] + "_" + System.currentTimeMillis() % 1000
                : nickname;
            // 역할이 없으면 무조건 GUEST
        Role finalRole = (role == null) ? Role.GUEST : role;
        return User.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .nickname(finalNickname) // 임시 닉네임 주입
                .role(finalRole)         // GUEST 역할 주입
                .build();
    }
}