package com.devnear.global.config;

import com.devnear.global.auth.JwtAuthenticationFilter;
import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.global.auth.OAuth2SuccessHandler;
import com.devnear.web.service.auth.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // [추가] 인증 실패 시 리다이렉트 방지 로직입니당
                .exceptionHandling(exception -> exception
                        // 인증되지 않은 사용자가 API 요청 시 302(리다이렉트)가 아닌 401(Unauthorized)을 반환하게 함
                        .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**", "/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/login/**", "/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/freelancers/**", "/api/v1/freelancers/**", "/api/projects/**", "/api/v1/projects/**", "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users/onboarding", "/api/v1/users/onboarding", "/api/users/onboarding/", "/api/v1/users/onboarding/").hasRole("GUEST")

                        // [수정] GUEST 여부 상관없이 "로그인한 모든 유저"는 내 정보를 볼 수 있어야 하므로 Role 체크 대신 authenticated() 사용
                        // [추가] 스프링 부트 3에서는 후행 슬래시(/) 여부에 따라 매칭이 실패할 수 있어 둘 다 열어둡니다.
                        .requestMatchers("/api/users/me", "/api/v1/users/me", "/api/users/me/", "/api/v1/users/me/").authenticated()

                        // 3. [권한] 프리랜서 전용 구역
                        .requestMatchers(HttpMethod.POST, "/api/portfolios", "/api/v1/portfolios", "/api/applications", "/api/v1/applications", "/api/skills", "/api/v1/skills").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/freelancers/status", "/api/v1/freelancers/status").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers("/api/freelancer/**", "/api/v1/freelancer/**").hasAnyRole("FREELANCER", "BOTH")

                        // 4. [권한] 클라이언트 전용 구역
                        // [보고] 팀원들이 추가한 프로젝트 수정(PUT), 삭제(DELETE) 권한도 CLIENT, BOTH로 묶어두었습니다.
                        .requestMatchers(HttpMethod.POST, "/api/projects", "/api/v1/projects").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PUT, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/projects/*/applications", "/api/v1/projects/*/applications", "/api/applications/*/accept", "/api/v1/applications/*/accept").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers("/api/client/**", "/api/v1/client/**").hasAnyRole("CLIENT", "BOTH")

                        // 5. [나머지]
                        .anyRequest().hasAnyRole("CLIENT", "FREELANCER", "BOTH")
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
