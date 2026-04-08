package com.devnear.web.domain.user;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.persistence.Transient;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity implements UserDetails { // 1. UserDetails 인터페이스 추가

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Builder
    public User(String email, String password, String name, String nickname, String phoneNumber, String profileImageUrl, Role role) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.profileImageUrl = profileImageUrl;
        this.role = role;
        this.status = UserStatus.ACTIVE;
    }

    // ================= [UserDetails 필수 구현 메서드] =================

    @Override
    @Transient
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // "ROLE_" 접두사를 붙여서 반환해야 시큐리티의 hasRole()이 타당하게 작동합니다.
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }
    @Override
    public String getUsername() {
        return this.email; // 우리 기지의 ID는 이메일입니다.
    }

    @Override
    public String getPassword() {
        return this.password; // 암호화된 비밀번호 필드와 연결
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // 계정 만료 여부 (true: 만료 안 됨)
    }

    @Override
    public boolean isAccountNonLocked() {
        // 만약 나중에 status가 BANNED이면 false를 주게 고칠 수도 있습니다.
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // 비번 만료 여부
    }

    @Override
    public boolean isEnabled() {
        // 유저 상태가 ACTIVE일 때만 활성화 (타당한 정합성 체크)
        return this.status == UserStatus.ACTIVE;
    }
}