package com.devnear.web.domain.user;

import com.devnear.web.domain.common.BaseTimeEntity;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.client.ClientProfile; // [추가] 패키지 경로 확인 필요
import com.devnear.web.domain.freelancer.FreelancerProfile; // [추가] 패키지 경로 확인 필요
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
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_provider_id",
                        columnNames = {"provider", "provider_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = true)
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

    @Column(length = 20)
    private String provider;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    // ================= [추가] 영속성 전이(Cascade) 설정 =================

    // [보고] 유저 삭제 시 클라이언트 프로필도 함께 삭제됩니다.
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private ClientProfile clientProfile;

    // [보고] 유저 삭제 시 프리랜서 프로필도 함께 삭제됩니다.
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private FreelancerProfile freelancerProfile;

    // =================================================================

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

    public User update(String name, String profileImageUrl, String provider, String providerId) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
        this.provider = provider;
        this.providerId = providerId;
        return this;
    }

    public void onboard(String nickname, Role role) {
        this.nickname = nickname;
        this.role = role;
    }

    // UserDetails 메서드 생략 (기존과 동일)
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
        return this.status == UserStatus.ACTIVE || this.status == UserStatus.INACTIVE;
    }
}