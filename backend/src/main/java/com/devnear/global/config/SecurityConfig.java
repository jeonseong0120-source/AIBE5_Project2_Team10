package com.devnear.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // API 서버이므로 CSRF 보안은 끕니다.
                .authorizeHttpRequests(auth -> auth
                        // 1. 회원가입과 스웨거 관련 주소는 모두 허용
                        .requestMatchers("/api/users/register", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // 2. 나머지는 일단 다 열어둠 (나중에 기능 완성되면 하나씩 잠글 거임)
                        .anyRequest().permitAll()
                );


        return http.build();
    }
    // 비밀번호 암호화
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}