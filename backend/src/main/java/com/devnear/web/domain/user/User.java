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
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.freelancer.FreelancerProfile;

import java.util.Collection;
import java.util.List;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_provider_id",
                        columnNames = {"provider", "provider_id"} // provider와 provider_id의 쌍은 유일해야 함
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

    // [보고] 소셜 로그인은 비번이 없으므로 nullable = true
    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    // [수정] 항상 임시 닉네임을 생성해서 넣어주므로 nullable = false
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

    // ================= [보고] 소셜 로그인 전용 필드 =================
    @Column(length = 20)
    private String provider;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    // [수정] 리뷰 피드백 반영: @OneToOne의 기본 로딩은 Eager(즉시 로딩)이므로 N+1 및 성능 이슈 방지를 위해 LAZY로 강제 지정
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private ClientProfile clientProfile;

    // [수정] 리뷰 피드백 반영: 동일하게 성능 이슈 방지를 위해 LAZY 로딩 적용
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private FreelancerProfile freelancerProfile;

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

    /**
     * [보고] 소셜 로그인 정보 업데이트 및 계정 연동을 위한 메서드.
     */
    public User update(String name, String profileImageUrl, String provider, String providerId) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
        this.provider = provider;
        this.providerId = providerId;
        return this;
    }

    /**
     * [추가] 온보딩 완료 시 닉네임과 역할을 업데이트합니다.
     */
    public void onboard(String nickname, Role role) {
        this.nickname = nickname;
        this.role = role;
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
        // [수정] "화이트리스트" 방식으로 허용되는 상태만 명시함
        return this.status == UserStatus.ACTIVE || this.status == UserStatus.INACTIVE; 
    }
}
