package com.devnear.global.config;

import com.devnear.global.auth.JwtAuthenticationFilter;
import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.global.auth.OAuth2SuccessHandler;
import com.devnear.web.service.auth.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500}")
    private List<String> allowedOrigins;

    @Value("${app.cors.allow-lan-origin-pattern:false}")
    private boolean allowLanOriginPattern;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                                        org.springframework.http.HttpStatus.UNAUTHORIZED
                                )
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // WebSocket / SockJS handshake 허용
                        .requestMatchers("/ws", "/ws/**").permitAll()

                        .requestMatchers(
                                "/api/auth/**",
                                "/api/v1/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/login/**",
                                "/oauth2/**"
                        ).permitAll()

                        // AI 추천: 프리랜서 본인 공고 추천
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/freelancers/*/recommended-projects",
                                "/api/v1/freelancers/*/recommended-projects"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        // 공개 조회
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/freelancers/**", "/api/v1/freelancers/**",
                                "/api/projects/**", "/api/v1/projects/**",
                                "/api/portfolios/**", "/api/v1/portfolios/**",
                                "/api/skills/**", "/api/v1/skills/**",
                                "/api/community/**", "/api/v1/community/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users/onboarding",
                                "/api/v1/users/onboarding",
                                "/api/users/onboarding/",
                                "/api/v1/users/onboarding/"
                        ).hasRole("GUEST")

                        .requestMatchers(
                                "/api/users/me",
                                "/api/v1/users/me",
                                "/api/users/me/",
                                "/api/v1/users/me/"
                        ).authenticated()

                        // 리뷰
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reviews/freelancers",
                                "/api/v1/reviews/freelancers"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reviews/clients",
                                "/api/v1/reviews/clients"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews/**",
                                "/api/v1/reviews/**"
                        ).permitAll()

                        // 프리랜서 전용
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/portfolios", "/api/v1/portfolios",
                                "/api/applications", "/api/v1/applications",
                                "/api/skills", "/api/v1/skills"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/portfolios/**", "/api/v1/portfolios/**",
                                "/api/skills/**", "/api/v1/skills/**"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/freelancers/status",
                                "/api/v1/freelancers/status"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                "/api/freelancer/**",
                                "/api/v1/freelancer/**"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        // 이미지 업로드
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/images/portfolio",
                                "/api/images/portfolios/bulk"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/images/profile"
                        ).authenticated()

                        // 스킬 추천
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/skills/suggest",
                                "/api/v1/skills/suggest"
                        ).hasAnyRole("CLIENT", "FREELANCER", "BOTH")

                        // 클라이언트 전용
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/projects",
                                "/api/v1/projects"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/projects/**",
                                "/api/v1/projects/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/projects/**",
                                "/api/v1/projects/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/projects/*/applications", "/api/v1/projects/*/applications",
                                "/api/applications/*/accept", "/api/v1/applications/*/accept",
                                "/api/projects/*/close", "/api/v1/projects/*/close",
                                "/api/projects/*/start", "/api/v1/projects/*/start",
                                "/api/projects/*/complete", "/api/v1/projects/*/complete"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                "/api/client/**",
                                "/api/v1/client/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        // 찜/북마크
                        .requestMatchers(
                                "/api/bookmarks/freelancers/**",
                                "/api/v1/bookmarks/freelancers/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                "/api/bookmarks/portfolios/**",
                                "/api/v1/bookmarks/portfolios/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                "/api/bookmarks/projects/**",
                                "/api/v1/bookmarks/projects/**"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        // 역제안
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/proposals",
                                "/api/v1/proposals"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/proposals/with-standalone-project",
                                "/api/v1/proposals/with-standalone-project"
                        ).hasAnyRole("CLIENT", "BOTH")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/proposals/sent",
                                "/api/v1/proposals/sent"
                        ).hasAnyRole("CLIENT", "BOTH")

                        // 결제
                        .requestMatchers(
                                "/api/payments/**",
                                "/api/v1/payments/**"
                        ).hasAnyRole("CLIENT", "BOTH")

                        // 받은 제안
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/proposals/received",
                                "/api/v1/proposals/received"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/proposals/*/status",
                                "/api/v1/proposals/*/status"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/proposals/*/inquire",
                                "/api/v1/proposals/*/inquire"
                        ).hasAnyRole("FREELANCER", "BOTH")

                        .anyRequest().hasAnyRole("CLIENT", "FREELANCER", "BOTH")
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_NO_CONTENT)
                        )
                        .permitAll()
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        Set<String> patterns = new LinkedHashSet<>();
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");

        if (allowLanOriginPattern) {
            patterns.add("http://192.168.*:*");
        }

        for (String origin : allowedOrigins) {
            if (origin != null && !origin.isBlank()) {
                patterns.add(origin.trim());
            }
        }

        config.setAllowedOriginPatterns(new ArrayList<>(patterns));
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