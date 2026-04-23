package com.devnear.global.auth;

import com.devnear.web.domain.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "@class")
public class SecurityUser implements UserDetails {
    private Long id;
    private String email;
    private String password;
    private String role;
    private String status;

    /**
     * 엔티티를 통한 생성자 (로그인 시점 등에 사용)
     */
    public SecurityUser(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole().name();
        this.status = user.getStatus().name();
    }

    /**
     * 🎯 [추가] 토큰 정보(Claims)를 통한 생성자
     * DB 조회 없이 필터 단계에서 인증 객체를 생성하기 위해 사용됩니다.
     */
    public SecurityUser(Long id, String email, String role, String status) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.password = ""; // 토큰 인증 시 패스워드는 불필요
        // 만약 구형 토큰이라 status가 없다면 차단을 유도하기 위해 UNKNOWN 처리
        this.status = status != null ? status : "UNKNOWN";
    }
    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        // ACTIVE 또는 INACTIVE 상태일 때만 true를 반환
        return "ACTIVE".equals(status) || "INACTIVE".equals(status);
    }
}