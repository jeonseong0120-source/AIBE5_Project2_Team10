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

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // [보고] 소셜 로그인은 비번이 없으므로 nullable = true
    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    // [보고] 소셜 가입 초기에는 닉네임이 없을 수 있으므로 nullable = true
    @Column(nullable = true, unique = true, length = 50)
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

    // ================= [보고] 소셜 로그인 전용 필드 =================
    @Column(length = 20)
    private String provider;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Builder
    public User(String email, String password, String name, String nickname,
                String phoneNumber, String profileImageUrl, Role role,
                String provider, String providerId) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.profileImageUrl = profileImageUrl;
        this.role = role;
        this.provider = provider;
        this.providerId = providerId;
        this.status = UserStatus.ACTIVE;
    }

    public User update(String name, String profileImageUrl) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
        return this;
    }

    // ================= UserDetails 필수 구현 메서드 =================
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public String getUsername() { return this.email; }

    @Override
    public String getPassword() { return this.password; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { 
        // [수정] INACTIVE(휴식 중) 유저도 로그인 자체는 가능해야 하므로,
        // 오직 WITHDRAWN(탈퇴) 상태인 경우에만 비활성화(false)로 처리함.
        return this.status != UserStatus.WITHDRAWN; 
    }
}
