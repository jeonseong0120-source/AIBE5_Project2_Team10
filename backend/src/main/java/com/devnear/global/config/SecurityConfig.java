package com.devnear.global.config;

import com.devnear.global.auth.JwtAuthenticationFilter; // 추가
import com.devnear.global.auth.JwtTokenProvider; // 추가
import lombok.RequiredArgsConstructor; // 추가
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy; // 추가
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // 추가

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor // 1. JwtTokenProvider 주입을 위해 추가
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider; // 2. 추가

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                // 3. 세션 사용 안 함 설정 (JWT 방식의 필수 관문)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 회원가입, 로그인, 스웨거는 검문 없이 통과
                        .requestMatchers("/api/users/register", "/api/users/login", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // 4. 나머지는 이제 '인증(JWT)'이 필요함 (anyRequest().authenticated()로 변경)
                        .anyRequest().authenticated()
                )
                // 5. 검문소(JwtAuthenticationFilter)를 기본 로그인 필터 앞에 배치
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}