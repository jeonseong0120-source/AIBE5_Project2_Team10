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
import org.springframework.http.HttpMethod;

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
                // [복구] CORS 설정 추가 (프론트엔드 통신 허용)
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
                        // [추가] 브라우저의 preflight(OPTIONS) 요청이 소셜 로그인 페이지로 리다이렉트 되는 현상 방지
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // [추가] 403 에러가 500 서버 에러로 가려지는 현상 방지를 위해 에러 페이지 허용
                        .requestMatchers("/error").permitAll()

                        // 0. [공통] 누구나 접근 가능 (소셜 로그인 진입점 추가)
                        // v1 경로가 있을 수 있으니 포함하여 열어둡니다.
                        .requestMatchers("/api/auth/**", "/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/login/**", "/oauth2/**").permitAll()

                        // 1. [조회] GET 요청은 비로그인도 가능 (명세서 준수)
                        .requestMatchers(HttpMethod.GET, "/api/freelancers/**", "/api/v1/freelancers/**", "/api/projects/**", "/api/v1/projects/**", "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").permitAll()

                        // [추가] 온보딩 API는 임시 권한인 GUEST만 접근할 수 있도록 명시
                        .requestMatchers(HttpMethod.POST, "/api/users/onboarding", "/api/v1/users/onboarding").hasRole("GUEST")

                        // 2. [인증] 내 정보 관련 (로그인 필수)
                        // [보고] GUEST 유저도 온보딩 화면에서 내 정보(이메일, 임시 닉네임)를 불러와야 하므로 권한에 GUEST 추가
                        .requestMatchers("/api/users/me", "/api/v1/users/me").hasAnyRole("GUEST", "CLIENT", "FREELANCER", "BOTH")

                        // 3. [권한] 프리랜서 전용 구역
                        .requestMatchers(HttpMethod.POST, "/api/portfolios", "/api/v1/portfolios", "/api/applications", "/api/v1/applications", "/api/skills", "/api/v1/skills").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/freelancers/status", "/api/v1/freelancers/status").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers("/api/freelancer/**", "/api/v1/freelancer/**").hasAnyRole("FREELANCER", "BOTH")

                        // 4. [권한] 클라이언트 전용 구역
                        .requestMatchers(HttpMethod.POST, "/api/projects", "/api/v1/projects").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/projects/*/applications", "/api/v1/projects/*/applications", "/api/applications/*/accept", "/api/v1/applications/*/accept").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers("/api/client/**", "/api/v1/client/**").hasAnyRole("CLIENT", "BOTH")

                        // 5. [나머지] 위 규칙에 해당 안 되는 모든 비즈니스 로직은 정식 유저(GUEST 제외)만 접근 가능하도록 강화
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

    /**
     * [보고] 프론트엔드(localhost:3000) 통신을 위한 CORS 전역 설정
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000")); // 프론트엔드 주소 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization")); // 프론트에서 헤더를 읽을 수 있도록 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}