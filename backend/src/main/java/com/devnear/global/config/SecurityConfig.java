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

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    // [보고] application.yml 에서 CORS 허용 주소를 읽어오도록 외부화 (배포 환경 대응)
    // 설정이 없을 경우 기본값으로 로컬호스트 주소를 사용합니다.
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**", "/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/login/**", "/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/freelancers/**", "/api/v1/freelancers/**", "/api/projects/**", "/api/v1/projects/**", "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users/onboarding", "/api/v1/users/onboarding", "/api/users/onboarding/", "/api/v1/users/onboarding/").hasRole("GUEST")

                        .requestMatchers("/api/users/me", "/api/v1/users/me", "/api/users/me/", "/api/v1/users/me/").authenticated()

                        .requestMatchers(HttpMethod.POST, "/api/portfolios", "/api/v1/portfolios", "/api/applications", "/api/v1/applications", "/api/skills", "/api/v1/skills").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/freelancers/status", "/api/v1/freelancers/status").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers("/api/freelancer/**", "/api/v1/freelancer/**").hasAnyRole("FREELANCER", "BOTH")

                        .requestMatchers(HttpMethod.POST, "/api/projects", "/api/v1/projects").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PUT, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/projects/*/applications", "/api/v1/projects/*/applications", "/api/applications/*/accept", "/api/v1/applications/*/accept").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers("/api/client/**", "/api/v1/client/**").hasAnyRole("CLIENT", "BOTH")

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
        // [수정] @Value로 읽어온 리스트(allowedOrigins)를 삽입하여 배포 환경 변경 대응
        config.setAllowedOrigins(allowedOrigins);
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
