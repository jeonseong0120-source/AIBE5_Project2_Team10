package com.devnear.web.dto.user;

import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.user.User;
import lombok.Getter;

@Getter
public class UserInfoResponse {
    private Long id;
    private String email;
    private String name;
    private String nickname;
    private String profileImageUrl;
    private Role role;

    public UserInfoResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.nickname = user.getNickname();
        this.profileImageUrl = user.getProfileImageUrl();
        this.role = user.getRole();
    }
}
